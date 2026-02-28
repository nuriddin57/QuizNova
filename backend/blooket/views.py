from django.conf import settings
from django.http import FileResponse, HttpResponseNotFound, JsonResponse
from django.views import View


def health(request):
    """Simple liveness endpoint to help the frontend confirm API reachability."""
    return JsonResponse({'status': 'ok', 'version': '1.0'})


class FrontendAppView(View):
    """Serve the pre-built React app for any non-API route."""

    def get(self, request, *args, **kwargs):
        index_file = getattr(settings, 'FRONTEND_INDEX_FILE', None)
        if not index_file or not index_file.exists():
            return HttpResponseNotFound('Frontend build not found. Run npm run build and copy dist to backend/static/frontend.')
        return FileResponse(index_file.open('rb'), content_type='text/html')
