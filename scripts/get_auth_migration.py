import importlib
import pathlib
import django

def main():
    mod = importlib.import_module('django.contrib.auth.migrations')
    p = pathlib.Path(mod.__file__).parent
    files = sorted([f.name for f in p.glob('*.py') if f.name[0].isdigit()])
    print('django_version=' + django.get_version())
    print('auth_migrations=' + ','.join(files))
    print('latest=' + (files[-1].replace('.py','') if files else ''))

if __name__ == '__main__':
    main()
