
## Requisitos para el proyecto

[] **Registro y logueado**
  No tener botón de Signup por defecto

[] **Contraseña**

  Pensar en usar bcrypt que genera un salt, se importa de python (pip install bcrypt) -- <mark>Aunque creo que Werkzeug ya hace esto</mark>

    import bcrypt

    SIGNUP:
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    rounds=12

    LOGIN:
    bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8'))

