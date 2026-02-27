import os
import django
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application
import games.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'blooket.settings')
django.setup()

application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(games.routing.websocket_urlpatterns)
        )
    ),
})
