import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { clienteSupabase } from '@/lib/supabase';


const horariosDisponiveis = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function TelaCadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataConsulta, setDataConsulta] = useState<Date | null>(null);
  const [horarioSelecionado, setHorarioSelecionado] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [carregando, setCarregando] = useState(false);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    const days = [];
    for (let i = 0; i < startingDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();
  
  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isSelected = (date: Date) => dataConsulta ? date.toDateString() === dataConsulta.toDateString() : false;

  const selectDate = (date: Date) => {
    if (!isPastDate(date)) {
      setDataConsulta(date);
      setHorarioSelecionado(null);
      setShowCalendar(false);
    }
  };

  const changeMonth = (increment: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + increment);
    setCurrentMonth(newMonth);
  };

  const confirmarAgendamento = async () => {
   
    if (!nome || !email || !telefone) {
      return Alert.alert('Atenção', 'Preencha nome, e-mail e telefone.');
    }
    if (!dataConsulta) {
      return Alert.alert('Atenção', 'Selecione uma data no calendário.');
    }
    if (!horarioSelecionado) {
      return Alert.alert('Atenção', 'Selecione um horário disponível.');
    }

    setCarregando(true);

    try {
     
      const { data: authData, error: authError } = await clienteSupabase.auth.signUp({
        email,
        password: '123456', // Senha padrão para cadastro inicial 
        options: {
          data: { nome, telefone, perfil: 'cliente' }
        }
      });

      if (authError) throw authError;
      if (!authData?.user?.id) throw new Error('Falha ao criar usuário');

      const clienteId = authData.user.id;

      
      const { error: perfilError } = await clienteSupabase
        .from('perfis')
        .insert({
          id: clienteId,
          nome,
          email,
          telefone,
          perfil: 'cliente',
          // push_token: null, 
        });

      if (perfilError) throw perfilError;

         const { error: agendamentoError } = await clienteSupabase
        .from('agendamentos')
        .insert({
          cliente_id: clienteId,
          data: dataConsulta.toISOString().split('T')[0],
          horario: horarioSelecionado,
          status: 'pendente',
          motivo: 'Primeira consulta - Agendamento pelo app'
        });

      if (agendamentoError) throw agendamentoError;

        Alert.alert(
        '✅ Sucesso!',
        'Agendamento realizado! Faça login para acompanhar.',
        [{ text: 'OK', onPress: () => router.push('/(autenticacao)/login') }]
      );

    } catch (erro: any) {
      console.error('❌ Erro no cadastro:', erro);
      Alert.alert('Erro', erro.message || 'Não foi possível realizar o cadastro.');
    } finally {
      setCarregando(false);
    }
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <View style={styles.marca}>
        <Text style={styles.balanca}>⚖️</Text>
        <Text style={styles.nomeAdvocacia}>J Silva</Text>
        <Text style={styles.subtitulo}>ADVOCACIA</Text>
        <Text style={styles.tituloSecao}>Agende sua Consulta</Text>
      </View>

      <View style={styles.formulario}>
        <View style={styles.campo}>
          <Text style={styles.label}>Nome Completo *</Text>
          <TextInput style={styles.input} placeholder="Seu nome completo" value={nome} onChangeText={setNome} />
        </View>

        <View style={styles.campo}>
          <Text style={styles.label}>E-mail *</Text>
          <TextInput style={styles.input} placeholder="seu@email.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        </View>

        <View style={styles.campo}>
          <Text style={styles.label}>Telefone *</Text>
          <TextInput style={styles.input} placeholder="(00) 00000-0000" keyboardType="phone-pad" value={telefone} onChangeText={setTelefone} />
        </View>

        {/* Calendário */}
        <View style={styles.campo}>
          <Text style={styles.label}>Data da Consulta *</Text>
          <TouchableOpacity style={styles.botaoData} onPress={() => setShowCalendar(!showCalendar)}>
            <Text style={styles.iconData}>📅</Text>
            <Text style={[styles.textoData, !dataConsulta && {color: '#999'}]}>
              {dataConsulta ? dataConsulta.toLocaleDateString('pt-BR') : 'Toque para escolher a data'}
            </Text>
          </TouchableOpacity>

          {showCalendar && (
            <View style={styles.calendario}>
              <View style={styles.calendarioHeader}>
                <TouchableOpacity onPress={() => changeMonth(-1)}><Text style={styles.seta}>‹</Text></TouchableOpacity>
                <Text style={styles.mesAno}>{meses[currentMonth.getMonth()]} {currentMonth.getFullYear()}</Text>
                <TouchableOpacity onPress={() => changeMonth(1)}><Text style={styles.seta}>›</Text></TouchableOpacity>
              </View>
              
              <View style={styles.diasSemana}>
                {diasSemana.map(dia => <Text key={dia} style={styles.diaSemanaTexto}>{dia}</Text>)}
              </View>
              
              <View style={styles.diasGrid}>
                {days.map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.diaItem,
                      day && isToday(day) && styles.diaHoje,
                      day && isSelected(day!) && styles.diaSelecionado,
                      day && isPastDate(day) && styles.diaPassado,
                      !day && styles.diaVazio
                    ]}
                    onPress={() => day && !isPastDate(day) && selectDate(day)}
                    disabled={!day || isPastDate(day)}
                  >
                    {day && <Text style={[styles.diaTexto, isToday(day) && styles.diaHojeTexto, isSelected(day) && styles.diaSelecionadoTexto, isPastDate(day) && styles.diaPassadoTexto]}>{day.getDate()}</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Horários */}
        {dataConsulta && (
          <View style={styles.campo}>
            <Text style={styles.label}>Horário Disponível *</Text>
            <View style={styles.gradeHorarios}>
              {horariosDisponiveis.map((horario) => (
                <TouchableOpacity
                  key={horario}
                  style={[styles.horarioItem, horarioSelecionado === horario && styles.horarioSelecionado]}
                  onPress={() => setHorarioSelecionado(horario)}
                >
                  <Text style={[styles.horarioTexto, horarioSelecionado === horario && styles.horarioTextoSelecionado]}>{horario}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity style={[styles.botaoConfirmar, carregando && styles.botaoDesativado]} onPress={confirmarAgendamento} disabled={carregando}>
          {carregando ? <ActivityIndicator color="#4a0e0e" /> : <Text style={styles.textoBotao}>Confirmar Agendamento</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkVoltar} onPress={() => router.push('/(autenticacao)/login')}>
          <Text style={styles.textoVoltar}>Já sou cliente - Fazer login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#4a0e0e' },
  conteudo: { paddingHorizontal: 24, paddingVertical: 40 },
  marca: { alignItems: 'center', marginBottom: 32 },
  balanca: { fontSize: 60, marginBottom: 12 },
  nomeAdvocacia: { fontSize: 38, fontWeight: 'bold', color: '#d4af37' },
  subtitulo: { fontSize: 16, color: '#d4af37', letterSpacing: 6, marginTop: 4, marginBottom: 16 },
  tituloSecao: { fontSize: 20, color: '#fff', marginTop: 16, fontWeight: '600' },
  formulario: { backgroundColor: '#4a0e0e' },
  campo: { marginBottom: 20 },
  label: { fontSize: 14, color: '#d4af37', marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 16, fontSize: 16, color: '#333' },
  botaoData: { backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  iconData: { fontSize: 20, marginRight: 12 },
  textoData: { fontSize: 16, color: '#333', flex: 1 },
  calendario: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 8, borderWidth: 1, borderColor: '#d4af37' },
  calendarioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  mesAno: { fontSize: 18, fontWeight: 'bold', color: '#4a0e0e' },
  seta: { fontSize: 28, color: '#d4af37', paddingHorizontal: 12 },
  diasSemana: { flexDirection: 'row', marginBottom: 8 },
  diaSemanaTexto: { flex: 1, textAlign: 'center', fontSize: 12, color: '#666', fontWeight: '600' },
  diasGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  diaItem: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginVertical: 2 },
  diaVazio: { width: '14.28%', aspectRatio: 1 },
  diaTexto: { fontSize: 14, color: '#333', width: 36, height: 36, borderRadius: 18, textAlign: 'center', lineHeight: 36 },
  diaHoje: { backgroundColor: '#d4af37' },
  diaHojeTexto: { color: '#4a0e0e', fontWeight: 'bold' },
  diaSelecionado: { backgroundColor: '#4a0e0e' },
  diaSelecionadoTexto: { color: '#d4af37', fontWeight: 'bold' },
  diaPassado: { opacity: 0.3 },
  diaPassadoTexto: { color: '#999' },
  gradeHorarios: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  horarioItem: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, borderWidth: 2, borderColor: '#ddd', minWidth: 80, alignItems: 'center' },
  horarioSelecionado: { backgroundColor: '#d4af37', borderColor: '#d4af37' },
  horarioTexto: { fontSize: 14, color: '#333', fontWeight: '600' },
  horarioTextoSelecionado: { color: '#4a0e0e' },
  botaoConfirmar: { backgroundColor: '#d4af37', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 16, marginBottom: 16 },
  botaoDesativado: { backgroundColor: '#8b8b8b' },
  textoBotao: { color: '#4a0e0e', fontWeight: 'bold', fontSize: 18 },
  linkVoltar: { alignItems: 'center', marginTop: 8 },
  textoVoltar: { color: '#d4af37', fontSize: 14, textDecorationLine: 'underline' },
});