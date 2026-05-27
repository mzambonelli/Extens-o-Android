# Extensao-Android
Trabalho de extensão da Faculdade Estácio de Sá

# J Silva Advocacia - App Jurídico

Aplicativo mobile completo para gestão de escritório de advocacia, desenvolvido em React Native com Expo para a disciplina de Desenvolvimento Android.

## Funcionalidades

### Para Clientes
- Agendamento de Consultas: Marque consultas com seleção de data e horário (segunda a sexta)
- Meus Agendamentos: Visualize, cancele ou reagende consultas pendentes
- Meus Processos: Acompanhe o andamento dos seus processos jurídicos
- Pagamentos: Visualize parcelas, histórico e status de pagamentos
- Comunicação: Envie mensagens e dúvidas diretamente ao advogado

### Para Advogados
- Gestão de Agenda: Confirme ou recuse agendamentos com justificativa
- Processos: Cadastre e gerencie processos por cliente
- Clientes: Visualize dados completos e histórico dos clientes
- Pagamentos: Controle de honorários com parcelamento automático
- Dúvidas: Responda questionamentos sobre processos

## Tecnologias Utilizadas

- React Native com Expo
- TypeScript para tipagem e segurança
- Supabase (Backend as a Service)
  - Autenticação de usuários
  - Banco de dados PostgreSQL
  - Row Level Security (RLS)
- Expo Router para navegação entre telas
- DateTimePicker para seleção de datas e horários

## Funcionalidades Especiais Implementadas

- Bloqueio de Finais de Semana: Sistema impede agendamentos aos sábados e domingos
- Motivo de Recusa: Advogado informa o motivo ao recusar agendamento, e o cliente é notificado
- Parcelamento Automático: Geração automática de parcelas ao cadastrar processo com honorários
- Detecção de Novo Cliente: Fluxo diferenciado para primeiro agendamento (motivo fixo)
- Interface Profissional: Design com cores institucionais (vinho e dourado)
- Status Visuais: Cores diferentes para pendente, confirmado e cancelado

## Estrutura do Banco de Dados

O projeto utiliza as seguintes tabelas no Supabase:

- perfis: Dados dos usuários (clientes e advogados) com separação por perfil
- processos: Processos jurídicos vinculados a clientes
- agendamentos: Consultas com data, horário, status e motivo
- pagamentos: Parcelas de honorários com controle de vencimento e status
- mensagens: Comunicação entre cliente e advogado

## Como Executar o Projeto

### Pré-requisitos
- Node.js instalado
- Expo CLI (npm install -g expo-cli)
- Conta no Supabase configurada
- Expo Go no celular (para testes)

### Passo a Passo

1. Clone o repositório:

git clone https://github.com/mzambonelli/Extens-o-Android.git
cd Extens-o-Android

2.Instale as dependências:

npm install

3. Configure o Supabase:

Crie um arquivo .env na raiz do projeto
Adicione suas credenciais:
SUPABASE_URL=sua_url_aqui
SUPABASE_ANON_KEY=sua_chave_anon_aqui

4. Inicie o Aplicativo: 

npx expo start

Escaneie o QR code com o Expo Go (Android/iOS) ou use o emulador

Identidade Visual:
Cor Primária: #4a0e0e (Vinho)
Cor Secundária: #d4af37 (Dourado)
Ícone: Balança da justiça em dourado sobre fundo vinho
Design: Responsivo, profissional e focado na experiência do usuário

Telas Implementadas:

Cliente:
- Login/Cadastro
- Agendamento de Consulta
- Meus Agendamentos (com cancelamento e reagendamento)
- Meus Processos
- Pagamentos
- Mensagens/Dúvidas

Advogado:
- Dashboard/Menu
- Agenda de Consultas (confirmar/recusar)
- Gestão de Clientes
- Cadastro de Processos
- Controle de Pagamentos
- Resposta de Dúvidas
- Segurança e Permissões
- Separação de permissões entre cliente e advogado
- Dados sensíveis protegidos
- Validação de campos e tratamento de erros

Configurações Importantes:

app.json:
{
  "name": "J Silva Advocacia",
  "slug": "juridico-app",
  "icon": "./assets/icon.png",
  "splash": {
    "image": "./assets/splash-icon.png",
    "backgroundColor": "#4a0e0e"
  }
}


Ícones e Splash Screen:

icon.png: 1024x1024 pixels
splash-icon.png: 1242x2436 pixels
adaptive-icon.png: 1024x1024 pixels
favicon.png: 64x64 pixels

Build e Produção:

Para gerar um APK de produção com os ícones e splash screen personalizados:
npx eas build --platform android --profile preview

Ou crie uma conta em https://expo.dev e use o EAS Build

Desenvolvimento:

Projeto Acadêmico desenvolvido para a disciplina de Programação Para Dispositivos Móveis em Android
Desenvolvedor: Mikaelly Zamboneli da Silva
Instituição: Faculdade Estácio de Sá
Curso: Engenharia de Software
Ano: 2026
Licença: Este projeto é de uso acadêmico e foi desenvolvido para fins educacionais.
Contribuição: Por se tratar de trabalho acadêmico, contribuições externas não estão sendo aceitas no momento.
Contato: Para dúvidas sobre o projeto, entrar em contato através das issues do GitHub.
Status do Projeto: Concluído
