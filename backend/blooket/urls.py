from django.contrib import admin
from django.urls import include, path, re_path

from .views import FrontendAppView, health


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health, name='health'),
    path('api/health', health, name='health-no-slash'),
    path('api/', include('users.urls')),
    path('api/', include('fields.urls')),
    path('api/', include('subjects.urls')),
    path('api/', include('quizzes.urls')),
    path('api/', include('games.urls')),
    path('api/', include('results.urls')),
    path('api/', include('analytics.urls')),
    path('api/', include('ai_tools.urls')),
    path('api/', include('marketing.urls')),
    path('api/integrations/', include('integrations.urls')),
]

spa_view = FrontendAppView.as_view()
urlpatterns += [
    path('', spa_view, name='spa-index'),
    path('login/', spa_view, name='spa-login'),
    path('register/', spa_view, name='spa-register'),
    path('dashboard/', spa_view, name='spa-dashboard'),
    path('discover/', spa_view, name='spa-discover'),
    re_path(r'^(?!admin/)(?!api/)(?!static/)(?!media/).+$', spa_view, name='spa-fallback'),
]
