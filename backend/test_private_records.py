"""Privacy boundary checks using fake records; no external database or AI calls."""
import os, unittest, copy
from types import SimpleNamespace
os.environ.setdefault('MONGO_URL','mongodb://127.0.0.1:27017')
os.environ.setdefault('DB_NAME','recipe_test')
import server
from fastapi.testclient import TestClient

def matches(row,query): return all(row.get(k)==v for k,v in query.items())
class Cursor:
    def __init__(self,rows): self.rows=rows
    def sort(self,*args): return self
    async def to_list(self,limit): return copy.deepcopy(self.rows[:limit])
class Collection:
    def __init__(self): self.rows=[]
    def find(self,query,projection=None): return Cursor([r for r in self.rows if matches(r,query)])
    async def find_one(self,query,projection=None): return copy.deepcopy(next((r for r in self.rows if matches(r,query)),None))
    async def insert_one(self,doc): self.rows.append(copy.deepcopy(doc))
    async def update_one(self,query,update,upsert=False):
        row=next((r for r in self.rows if matches(r,query)),None);count=int(row is not None)
        if row is None and upsert: row=dict(query);self.rows.append(row)
        if row is not None: row.update(copy.deepcopy(update['$set']))
        return SimpleNamespace(matched_count=count)
    async def delete_one(self,query):
        row=next((r for r in self.rows if matches(r,query)),None)
        if row is not None:self.rows.remove(row)
        return SimpleNamespace(deleted_count=int(row is not None))
    async def delete_many(self,query): self.rows[:]=[r for r in self.rows if not matches(r,query)]
class PrivateRecords(unittest.TestCase):
    def setUp(self):
        server.db=SimpleNamespace(**{name:Collection() for name in ['health_profiles','pantry','recipes','recipe_ratings']})
        self.client=TestClient(server.app);self.a={'X-Recipe-Session':'1'*64};self.b={'X-Recipe-Session':'2'*64}
    def test_invalid_session_rejected(self):
        for path in ['/api/health-profile','/api/pantry','/api/recipes','/api/recipes/id','/api/recipes/id/ratings']:
            self.assertEqual(self.client.get(path).status_code,401)
            self.assertEqual(self.client.get(path,headers={'X-Recipe-Session':'invalid'}).status_code,401)
    def test_profiles_do_not_overwrite_or_adopt_legacy_data(self):
        server.db.health_profiles.rows.append({'id':'legacy','conditions':['legacy-private']})
        for headers,condition in [(self.a,'test-A'),(self.b,'test-B')]:
            response=self.client.post('/api/health-profile',headers=headers,json={'conditions':[condition]})
            self.assertEqual(response.status_code,200);self.assertNotIn('owner',response.json())
        self.assertEqual(self.client.get('/api/health-profile',headers=self.a).json()['conditions'],['test-A'])
        self.assertEqual(self.client.get('/api/health-profile',headers=self.b).json()['conditions'],['test-B'])
        self.client.post('/api/health-profile',headers=self.a,json={'conditions':['updated-A']})
        self.assertEqual(len(server.db.health_profiles.rows),3)
        self.assertEqual(server.db.health_profiles.rows[0]['conditions'],['legacy-private'])
    def test_pantry_delete_and_clear_are_private(self):
        row=self.client.post('/api/pantry',headers=self.a,json={'ingredient_name':'carrots'}).json()
        self.assertEqual(self.client.get('/api/pantry',headers=self.b).json(),[])
        self.assertEqual(self.client.delete('/api/pantry/'+row['id'],headers=self.b).status_code,404)
        self.client.delete('/api/pantry',headers=self.b)
        self.assertEqual(len(self.client.get('/api/pantry',headers=self.a).json()),1)
        self.client.delete('/api/pantry',headers=self.a)
        self.assertEqual(self.client.get('/api/pantry',headers=self.a).json(),[])
    def test_recipes_and_ratings_cannot_cross_devices(self):
        server.db.recipes.rows.append({'id':'private-recipe','owner':server.current_owner('1'*64)})
        self.assertEqual(self.client.get('/api/recipes',headers=self.b).json(),[])
        self.assertEqual(self.client.get('/api/recipes/private-recipe',headers=self.b).status_code,404)
        self.assertEqual(self.client.patch('/api/recipes/private-recipe/favorite?is_favorite=true',headers=self.b).status_code,404)
        self.assertEqual(self.client.delete('/api/recipes/private-recipe',headers=self.b).status_code,404)
        self.assertEqual(self.client.post('/api/recipes/private-recipe/ratings',headers=self.b,json={'recipe_id':'private-recipe','rating':4}).status_code,404)
        self.assertEqual(len(server.db.recipes.rows),1)
    def test_generation_cannot_use_another_profile(self):
        row=self.client.post('/api/health-profile',headers=self.a,json={'conditions':['test-only']}).json()
        result=self.client.post('/api/recipes/generate',headers=self.b,json={'pantry_items':['rice'],'dietary_preference':'plant based','health_profile_id':row['id']})
        self.assertEqual(result.status_code,404)
    def test_cors_site_allowed_other_origin_rejected(self):
        r=self.client.options('/api/health-profile',headers={'Origin':'https://askdogood.com','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'x-recipe-session,content-type'})
        self.assertEqual(r.status_code,200);self.assertEqual(r.headers['access-control-allow-origin'],'https://askdogood.com')
        r=self.client.options('/api/health-profile',headers={'Origin':'https://untrusted.example','Access-Control-Request-Method':'POST'})
        self.assertNotIn('access-control-allow-origin',r.headers)
if __name__=='__main__': unittest.main()

class GeneratorResponse(unittest.IsolatedAsyncioTestCase):
    async def test_json_response_and_allergy_without_conditions(self):
        from unittest.mock import patch
        captured = {}
        class Response:
            def json(self): return {'choices':[{'message':{'content':'```json\n{"title":"Test recipe"}\n```'}}]}
            def raise_for_status(self): pass
        class FakeClient:
            async def __aenter__(self): return self
            async def __aexit__(self,*args): pass
            async def post(self,url,**kwargs): captured.update(kwargs); return Response()
        with patch.dict(os.environ,{'EMERGENT_LLM_KEY':'test-only'}), patch.object(server.httpx,'AsyncClient',return_value=FakeClient()):
            result=await server.generate_recipe_with_ai(['rice'],'vegan','dinner',1,server.HealthProfile(conditions=[],allergies=['peanuts']))
        self.assertEqual(result['title'],'Test recipe')
        self.assertIn('peanuts',captured['json']['messages'][1]['content'])
