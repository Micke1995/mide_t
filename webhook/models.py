from django.db import models

class HistoricWebhook(models.Model):
    method = models.CharField(max_length=10)
    path = models.CharField(max_length=255, blank=True, null=True)
    headers = models.JSONField(blank=True, null=True)
    query_params = models.JSONField(blank=True, null=True)
    body = models.TextField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.CharField(max_length=255, blank=True, null=True)
    content_type = models.CharField(max_length=100, blank=True, null=True)
    response_status = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    request_size = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f'{self.method} - {self.created_at}'
