import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { clienteSupabase } from '@/lib/supabase';
import { usarAutenticacao } from '@/store/autenticacao';

type Pagamento = {
  id: string;
  mes: string;
  valor: string;
  status: string;
  data: string;
  numeroProcesso: string;
};

export default function PagamentosCliente() {
  const { usuario } = usarAutenticacao();
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarPagamentos();
  }, [usuario]);

  const carregarPagamentos = async () => {
    if (!usuario) return;

    try {
      const { data, error } = await clienteSupabase
        .from('pagamentos')
        .select(`
          id, 
          valor, 
          vencimento, 
          status,
          processos:processo_id (numero)
        `)
        .eq('cliente_id', usuario.id)
        .order('vencimento', { ascending: true });

      if (error) throw error;

      // Ajuste aqui para garantir que o TypeScript entenda a estrutura
      const listaFormatada = data?.map((item: any) => {
        const dataVenc = new Date(item.vencimento);
        const mes = dataVenc.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        const dia = dataVenc.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        
        // Verifica se processos é um array ou objeto para pegar o numero com segurança
        const processoData = Array.isArray(item.processos) ? item.processos[0] : item.processos;
        
        return {
          id: item.id,
          mes: mes.charAt(0).toUpperCase() + mes.slice(1),
          valor: `R$ ${parseFloat(item.valor).toFixed(2).replace('.', ',')}`,
          status: item.status === 'pago' ? 'Pago' : 'Pendente',
          data: dia,
          numeroProcesso: processoData?.numero || 'Honorários advocatícios',
        };
      }) || [];

      setPagamentos(listaFormatada);
    } catch (err) {
      console.error('Erro ao carregar pagamentos:', err);
    } finally {
      setCarregando(false);
    }
  };

  if (carregando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d4af37" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.voltar}>
          <Text style={styles.voltarTexto}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Pagamentos</Text>
      </View>

      <View style={styles.conteudo}>
        {pagamentos.length === 0 ? (
          <Text style={styles.vazio}>Nenhum pagamento encontrado.</Text>
        ) : (
          pagamentos.map((p) => (
            <View key={p.id} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.mes}>{p.mes}</Text>
                <Text style={p.status === 'Pago' ? styles.statusPago : styles.statusPend}>
                  {p.status}
                </Text>
              </View>
              <Text style={styles.valor}>{p.valor}</Text>
              <Text style={styles.processo}>⚖️ {p.numeroProcesso}</Text>
              <Text style={styles.detalhe}>Vencimento: {p.data}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#4a0e0e', padding: 24, paddingTop: 60, alignItems: 'center', paddingBottom: 30 },
  voltar: { position: 'absolute', top: 60, left: 20 },
  voltarTexto: { color: '#d4af37', fontSize: 16, fontWeight: 'bold' },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  conteudo: { padding: 20 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  mes: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  statusPago: { color: '#2e7d32', fontWeight: 'bold' },
  statusPend: { color: '#d32f2f', fontWeight: 'bold' },
  valor: { fontSize: 18, color: '#4a0e0e', fontWeight: 'bold', marginBottom: 4 },
  processo: { fontSize: 13, color: '#4a0e0e', marginBottom: 4, fontWeight: '500' },
  detalhe: { fontSize: 12, color: '#666' },
  vazio: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16 },
});