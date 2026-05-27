import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Alert, ActivityIndicator, TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { clienteSupabase } from '@/lib/supabase';
import { usarAutenticacao } from '@/store/autenticacao';

export default function AgendamentoCliente() {
  const { usuario } = usarAutenticacao();
  const [data, setData] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [horario, setHorario] = useState('');
  const [motivo, setMotivo] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [isNovoCliente, setIsNovoCliente] = useState(false);

  const horariosVagos = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

  useEffect(() => {
    if (!usuario) return;

    const verificarHistorico = async () => {
      try {
        const { data: historico, error } = await clienteSupabase
          .from('agendamentos')
          .select('id')
          .eq('cliente_id', usuario.id)
          .limit(1);

        if (error) throw error;

        if (!historico || historico.length === 0) {
          setIsNovoCliente(true);
          setMotivo('Primeira consulta');
        }
      } catch (err) {
        console.error('Erro ao verificar histórico:', err);
      }
    };

    verificarHistorico();
  }, [usuario]);

  const confirmar = async () => {
    if (!usuario) {
      return Alert.alert('Erro', 'Você precisa estar logado.');
    }
    if (!data || !horario) {
      return Alert.alert('Atenção', 'Escolha data e horário.');
    }

    setCarregando(true);

    const motivoFinal = motivo.trim() || 'Agendamento pelo portal';

    try {
      const { error } = await clienteSupabase
        .from('agendamentos')
        .insert({
          cliente_id: usuario.id,
          data: data.toISOString().split('T')[0],
          horario: horario,
          status: 'pendente',
          motivo: motivoFinal
        });

      if (error) throw error;

      Alert.alert(
        'Sucesso!', 
        'Solicitação enviada. Aguarde confirmação do advogado.',
        [{ text: 'OK', onPress: () => router.push('/(cliente)/agendamentos') }]
      );

    } catch (erro: any) {
      console.error('Erro ao agendar:', erro);
      Alert.alert('Erro', 'Não foi possível agendar. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.voltar}>
          <Text style={styles.voltarTexto}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.balanca}>️</Text>
        <Text style={styles.titulo}>Agendar Consulta</Text>
      </View>

      <View style={styles.conteudo}>
        <TouchableOpacity style={styles.card} onPress={() => setShowPicker(true)}>
          <Text style={styles.label}>Escolha a Data (Segunda a Sexta)</Text>
          <Text style={styles.valor}>
            {data ? data.toLocaleDateString('pt-BR') : '📅 Toque para selecionar'}
          </Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={data || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowPicker(false);
              if (selectedDate) {
                const diaSemana = selectedDate.getDay();
                if (diaSemana === 0 || diaSemana === 6) {
                  Alert.alert(
                    'Atenção', 
                    'O escritório não funciona aos finais de semana. Por favor, selecione um dia útil (segunda a sexta).'
                  );
                  setData(null);
                } else {
                  setData(selectedDate);
                }
              }
            }}
            minimumDate={new Date()}
          />
        )}

        {data && (
          <View style={styles.card}>
            <Text style={styles.label}>Horários Disponíveis</Text>
            <View style={styles.grade}>
              {horariosVagos.map(h => (
                <TouchableOpacity
                  key={h}
                  style={[styles.botaoHora, horario === h && styles.horaSelecionada]}
                  onPress={() => setHorario(h)}
                >
                  <Text style={[styles.textoHora, horario === h && styles.textoHoraSel]}>{h}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.label}>Motivo da Consulta</Text>
          {isNovoCliente ? (
            <View style={styles.motivoFixo}>
              <Text style={styles.motivoFixoTexto}>{motivo}</Text>
            </View>
          ) : (
            <TextInput
              style={styles.inputMotivo}
              placeholder="Ex: Dúvida sobre processo, Revisão de contrato, Segunda via..."
              value={motivo}
              onChangeText={setMotivo}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          )}
        </View>

        <TouchableOpacity 
          style={[styles.botaoConfirmar, carregando && styles.botaoDesativado]} 
          onPress={confirmar}
          disabled={carregando}
        >
          {carregando ? (
            <ActivityIndicator color="#4a0e0e" />
          ) : (
            <Text style={styles.textoBotao}>Solicitar Agendamento</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#4a0e0e', padding: 24, paddingTop: 60, alignItems: 'center', paddingBottom: 30 },
  voltar: { position: 'absolute', top: 60, left: 20, padding: 8 },
  voltarTexto: { color: '#d4af37', fontSize: 16, fontWeight: 'bold' },
  balanca: { fontSize: 50, marginBottom: 10 },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  conteudo: { padding: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 20, elevation: 2 },
  label: { fontSize: 14, color: '#666', marginBottom: 8 },
  valor: { fontSize: 18, color: '#333', fontWeight: '600' },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  botaoHora: { backgroundColor: '#eee', padding: 12, borderRadius: 8, width: '30%' },
  horaSelecionada: { backgroundColor: '#d4af37' },
  textoHora: { textAlign: 'center', color: '#333' },
  textoHoraSel: { color: '#4a0e0e', fontWeight: 'bold' },
  motivoFixo: { 
    backgroundColor: '#f0f7ff', 
    padding: 14, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#d4af37' 
  },
  motivoFixoTexto: { 
    fontSize: 16, 
    color: '#4a0e0e', 
    fontWeight: '600', 
    fontStyle: 'italic' 
  },
  inputMotivo: { 
    backgroundColor: '#f9f9f9', 
    padding: 12, 
    borderRadius: 8, 
    fontSize: 14, 
    borderWidth: 1, 
    borderColor: '#ddd',
    minHeight: 100,
    textAlignVertical: 'top'
  },
  botaoConfirmar: { backgroundColor: '#d4af37', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  botaoDesativado: { backgroundColor: '#8b8b8b' },
  textoBotao: { color: '#4a0e0e', fontWeight: 'bold', fontSize: 16 },
});