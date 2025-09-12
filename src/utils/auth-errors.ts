export const translateAuthError = (error: string): string => {
  const errorMessages: { [key: string]: string } = {
    'Invalid login credentials': 'Credenciales de acceso inválidas',
    'Email not confirmed': 'Email no confirmado',
    'User not found': 'Usuario no encontrado',
    'Invalid email': 'Email inválido',
    'Invalid password': 'Contraseña inválida',
    'Email already in use': 'El email ya está en uso',
    'Password is too short': 'La contraseña es muy corta',
    'User already registered': 'El usuario ya está registrado',
    'Invalid verification code': 'Código de verificación inválido',
  }

  return errorMessages[error] || 'Error al iniciar sesión'
}
