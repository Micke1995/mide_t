from django.urls import path

from . import views

urlpatterns = [
    path("", views.webhook_receiver, name="webhook_receiver"),
]
