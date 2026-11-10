import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

_DEFAULT_URL = "https://placeholder-project.supabase.co"
_DEFAULT_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxOTAwMDAwMDAwfQ.placeholder"

SUPABASE_URL = os.environ.get("SUPABASE_URL") or _DEFAULT_URL
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY") or _DEFAULT_KEY

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
except Exception:
    supabase: Client = create_client(_DEFAULT_URL, _DEFAULT_KEY)
