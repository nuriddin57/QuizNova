from django.db import models


class Programme(models.Model):
    code = models.SlugField(max_length=80, unique=True)
    title = models.CharField(max_length=160, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['title']

    def __str__(self):
        return self.title


class StudyField(models.Model):
    code = models.SlugField(max_length=80, unique=True)
    name = models.CharField(max_length=160, unique=True)
    programme = models.ForeignKey(
        Programme,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='fields',
    )
    department = models.CharField(max_length=160, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name
