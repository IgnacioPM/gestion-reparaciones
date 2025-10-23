export interface Empleado {
  id_usuario: string;
  nombre: string;
  email: string;
  rol: "Tecnico" | "Admin" | null;
}
