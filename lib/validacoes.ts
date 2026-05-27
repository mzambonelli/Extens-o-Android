import { z } from 'zod';

export const esquemaLogin = z.object({
  email: z.string().email('Informe um e-mail válido'),
  senha: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

export const esquemaCadastro = z.object({
  nomeCompleto: z.string().min(3, 'Nome muito curto'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve conter 11 dígitos'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Mínimo de 6 caracteres'),
  perfil: z.enum(['cliente', 'advogado']),
});