import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { usarAutenticacao } from '@/store/autenticacao';
import { clienteSupabase } from '@/lib/supabase';

type ParcelaAlerta = {
  id: string;
  valor: number;
  vencimento: string;
  dias_atraso: number;
};

export default function DashboardCliente() {
  const { usuario, sair } = usarAutenticacao();
  const [nomeCliente, setNomeCliente] = useState('Cliente');
  const [carregandoNome, setCarregandoNome] = useState(true);
  const [parcelaAlerta, setParcelaAlerta] = useState<ParcelaAlerta | null>(null);
  const [mostrarAlerta, setMostrarAlerta] = useState(true);

  useEffect(() => {
    const carregarNome = async () => {
      if (usuario?.id) {
        try {
          const { data } = await clienteSupabase
            .from('perfis')
            .select('nome')
            .eq('id', usuario.id)
            .single();

          if (data?.nome) {
            setNomeCliente(data.nome);
          }
        } catch (erro) {
          console.error('Erro ao carregar nome:', erro);
        } finally {
          setCarregandoNome(false);
        }
      } else {
        setCarregandoNome(false);
      }
    };
    carregarNome();
  }, [usuario]);

 
  useEffect(() => {
    const verificarParcelas = async () => {
      if (!usuario?.id) return;

      try {
        const hoje = new Date();
        const daqui3Dias = new Date(hoje);
        daqui3Dias.setDate(hoje.getDate() + 3);

        
        const { data: parcelas, error } = await clienteSupabase
          .from('pagamentos')
          .select('id, valor, vencimento, status') 
          .eq('cliente_id', usuario.id)
          .gte('vencimento', hoje.toISOString().split('T')[0])
          .lte('vencimento', daqui3Dias.toISOString().split('T')[0])
          .eq('status', 'pendente')
          .order('vencimento', { ascending: true })
          .limit(1);

        if (error) throw error;

        if (parcelas && parcelas.length > 0) {
          const parcela = parcelas[0];
          const dataVenc = new Date(parcela.vencimento); 
          const diffTime = dataVenc.getTime() - hoje.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          setParcelaAlerta({
            id: parcela.id,
            valor: parcela.valor,
            vencimento: parcela.vencimento,
            dias_atraso: diffDays,
          });
          setMostrarAlerta(true);
        } else {
          setParcelaAlerta(null);
        }

      } catch (erro) {
        console.error('Erro ao verificar parcelas:', erro);
      }
    };

    verificarParcelas();
  }, [usuario]);

  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  if (carregandoNome) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d4af37" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
          {mostrarAlerta && parcelaAlerta && (
        <View style={styles.bannerAlerta}>
          <View style={styles.alertaConteudo}>
            <Text style={styles.textoAlerta}>
              ️ {parcelaAlerta.dias_atraso === 0 
                ? 'Parcela vence HOJE!' 
                : `Atenção: Parcela vence em ${parcelaAlerta.dias_atraso} dias!`
              }
            </Text>
            <Text style={styles.valorAlerta}>
              {formatarValor(parcelaAlerta.valor)} - Venc: {formatarData(parcelaAlerta.vencimento)}
            </Text>
          </View>
          <View style={styles.alertaAcoes}>
            <TouchableOpacity 
              onPress={() => router.push('/(cliente)/pagamentos')}
              style={styles.botaoVerPagamentos}
            >
              <Text style={styles.linkAlerta}>Ver</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMostrarAlerta(false)}>
              <Text style={styles.botaoFechar}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Header Padrão */}
      <View style={styles.header}>
        <Text style={styles.balanca}>⚖️</Text>
        <Text style={styles.nomeAdvocacia}>J Silva</Text>
        <Text style={styles.subtitulo}>ADVOCACIA</Text>
        <Text style={styles.nomeUsuario}>
          Olá, {nomeCliente.split(' ')[0]}
        </Text>
      </View>

      {/* Menu */}
      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(cliente)/meus-processos')}>
          <Text style={styles.menuIcon}>📋</Text>
          <View style={styles.menuTexto}>
            <Text style={styles.menuTitulo}>Meus Processos</Text>
            <Text style={styles.menuDescricao}>Acompanhe suas ações</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(cliente)/agendamentos')}>
          <Text style={styles.menuIcon}>📅</Text>
          <View style={styles.menuTexto}>
            <Text style={styles.menuTitulo}>Meus Agendamentos</Text>
            <Text style={styles.menuDescricao}>Consultas marcadas</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(cliente)/mensagens')}>
          <Text style={styles.menuIcon}>💬</Text>
          <View style={styles.menuTexto}>
            <Text style={styles.menuTitulo}>Mensagens</Text>
            <Text style={styles.menuDescricao}>Fale com o advogado</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(cliente)/perfil')}>
          <Text style={styles.menuIcon}>👤</Text>
          <View style={styles.menuTexto}>
            <Text style={styles.menuTitulo}>Meu Perfil</Text>
            <Text style={styles.menuDescricao}>Editar dados e senha</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(cliente)/pagamentos')}>
          <Text style={styles.menuIcon}>💰</Text>
          <View style={styles.menuTexto}>
            <Text style={styles.menuTitulo}>Pagamentos</Text>
            <Text style={styles.menuDescricao}>Parcelas e histórico</Text>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.botaoSair} onPress={sair}>
        <Text style={styles.textoSair}> Sair da Conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  bannerAlerta: { 
    backgroundColor: '#fff3cd', 
    padding: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderBottomWidth: 1, 
    borderColor: '#ffeeba',
    paddingHorizontal: 16,
  },
  alertaConteudo: { flex: 1, marginRight: 12 },
  textoAlerta: { color: '#856404', fontWeight: 'bold', fontSize: 14, marginBottom: 2 },
  valorAlerta: { color: '#856404', fontSize: 12 },
  alertaAcoes: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  botaoVerPagamentos: { paddingHorizontal: 8 },
  linkAlerta: { color: '#004085', fontWeight: 'bold', textDecorationLine: 'underline', fontSize: 14 },
  botaoFechar: { color: '#856404', fontSize: 18, fontWeight: 'bold', padding: 4 },
  header: { backgroundColor: '#4a0e0e', padding: 24, paddingTop: 60, alignItems: 'center', paddingBottom: 32 },
  balanca: { fontSize: 70, marginBottom: 12 },
  nomeAdvocacia: { fontSize: 38, fontWeight: 'bold', color: '#d4af37' },
  subtitulo: { fontSize: 16, color: '#d4af37', letterSpacing: 6, marginTop: 4, marginBottom: 20 },
  nomeUsuario: { fontSize: 18, color: '#d4af37', fontWeight: '600' },
  menuContainer: { padding: 16, marginTop: 8 },
  menuItem: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 12, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  menuIcon: { fontSize: 32, marginRight: 16 },
  menuTexto: { flex: 1 },
  menuTitulo: { fontSize: 18, fontWeight: '600', color: '#333' },
  menuDescricao: { fontSize: 14, color: '#666' },
  botaoSair: { backgroundColor: '#d32f2f', margin: 16, padding: 12, borderRadius: 12, alignItems: 'center' },
  textoSair: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});