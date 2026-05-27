import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator, Switch, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { clienteSupabase } from '@/lib/supabase';
import { Picker } from '@react-native-picker/picker';

type Cliente = { id: string; nome: string };

export default function NovoProcesso() {
  const { cliente_id: clienteIdParam } = useLocalSearchParams<{ cliente_id?: string }>();
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<string | null>(null);
  const [nomeCliente, setNomeCliente] = useState<string>('');
  const [numero, setNumero] = useState('');
  const [vara, setVara] = useState('');
  const [descricao, setDescricao] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  
  const [comPagamento, setComPagamento] = useState(false);
  const [qtdParcelas, setQtdParcelas] = useState('');
  const [valorParcela, setValorParcela] = useState('');
  const [diaVencimento, setDiaVencimento] = useState('10');

  useEffect(() => {
    carregarClientes();
  }, []);

  useEffect(() => {
    if (clienteIdParam) {
      setClienteSelecionado(clienteIdParam);
      buscarNomeCliente(clienteIdParam);
    }
  }, [clienteIdParam]);

  const carregarClientes = async () => {
    try {
      const { data, error } = await clienteSupabase
        .from('perfis')
        .select('id, nome')
        .eq('perfil', 'cliente');

      if (error) throw error;
      setClientes(data || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível carregar clientes.');
    } finally {
      setCarregando(false);
    }
  };

  const buscarNomeCliente = async (id: string) => {
    try {
      const { data } = await clienteSupabase
        .from('perfis')
        .select('nome')
        .eq('id', id)
        .single();
      if (data?.nome) {
        setNomeCliente(data.nome);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const calcularDatasVencimento = (qtd: number, dia: number): string[] => {
    const datas: string[] = [];
    const hoje = new Date();
    let mes = hoje.getMonth();
    let ano = hoje.getFullYear();

    for (let i = 0; i < qtd; i++) {
      mes++;
      if (mes > 11) {
        mes = 0;
        ano++;
      }
      
      let dataVenc = new Date(ano, mes, dia);
      if (dataVenc.getMonth() !== mes) {
        dataVenc = new Date(ano, mes + 1, 0);
      }
      datas.push(dataVenc.toISOString().split('T')[0]);
    }
    return datas;
  };

  const salvarProcesso = async () => {
    if (!clienteSelecionado || !numero) {
      return Alert.alert('Atenção', 'Selecione um cliente e preencha o número do processo.');
    }

    if (comPagamento) {
      if (!qtdParcelas || !valorParcela || !diaVencimento) {
        return Alert.alert('Atenção', 'Preencha os dados do parcelamento.');
      }
      if (parseInt(qtdParcelas) < 1 || parseFloat(valorParcela) <= 0) {
        return Alert.alert('Atenção', 'Quantidade e valor devem ser maiores que zero.');
      }
    }

    setSalvando(true);
    try {
      const { data: processo, error: erroProcesso } = await clienteSupabase
        .from('processos')
        .insert({
          cliente_id: clienteSelecionado,
          numero,
          vara: vara || 'Não informada',
          status: 'Em andamento',
          descricao: descricao || '',
        })
        .select()
        .single();

      if (erroProcesso) throw erroProcesso;

      if (comPagamento) {
        const qtd = parseInt(qtdParcelas);
        const dia = parseInt(diaVencimento);
        const valor = parseFloat(valorParcela);
        const datas = calcularDatasVencimento(qtd, dia);

        const parcelasParaInserir = datas.map(dataVenc => ({
          cliente_id: clienteSelecionado,
          processo_id: processo.id,
          valor,
          vencimento: dataVenc,
          status: 'pendente',
        }));

        const { error: erroParcelas } = await clienteSupabase
          .from('pagamentos')
          .insert(parcelasParaInserir);

        if (erroParcelas) throw erroParcelas;
      }

      Alert.alert('Sucesso', 'Processo cadastrado com sucesso!');
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Falha ao salvar.');
    } finally {
      setSalvando(false);
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
        <TouchableOpacity onPress={() => router.back()} style={styles.botaoVoltar}>
          <Text style={styles.voltarTexto}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Novo Processo</Text>
      </View>

      <View style={styles.conteudo}>
        <Text style={styles.subtitulo}>1. Selecione o Cliente:</Text>
        
        {nomeCliente ? (
          <View style={styles.clienteFixo}>
            <Text style={styles.clienteNome}>{nomeCliente}</Text>
            <Text style={styles.clienteId}>{clienteSelecionado?.slice(0, 8)}...</Text>
          </View>
        ) : (
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={clienteSelecionado}
              onValueChange={(itemValue) => {
                setClienteSelecionado(itemValue);
                const cliente = clientes.find(c => c.id === itemValue);
                if (cliente) {
                  setNomeCliente(cliente.nome);
                }
              }}
              style={styles.picker}
            >
              <Picker.Item label="Selecione um cliente..." value="" />
              {clientes.map((cli) => (
                <Picker.Item key={cli.id} label={cli.nome} value={cli.id} />
              ))}
            </Picker>
          </View>
        )}

        <Text style={styles.subtitulo}>2. Dados do Processo:</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Número do Processo (ex: 0001234...)" 
          value={numero}
          onChangeText={setNumero}
        />
        <TextInput 
          style={styles.input} 
          placeholder="Vara / Tribunal" 
          value={vara}
          onChangeText={setVara}
        />
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="Descrição ou Anotação..." 
          value={descricao}
          onChangeText={setDescricao}
          multiline
          numberOfLines={4}
        />

        <View style={styles.divisor} />
        
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleTexto}>Cobrar honorários parcelados?</Text>
          <Switch
            value={comPagamento}
            onValueChange={setComPagamento}
            trackColor={{ false: '#ccc', true: '#d4af37' }}
            thumbColor={comPagamento ? '#4a0e0e' : '#f4f3f4'}
          />
        </View>

        {comPagamento && (
          <View style={styles.camposPagamento}>
            <Text style={styles.label}>Quantidade de parcelas</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ex: 5" 
              value={qtdParcelas}
              onChangeText={setQtdParcelas}
              keyboardType="numeric"
            />
            <Text style={styles.label}>Valor de cada parcela (R$)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ex: 500.00" 
              value={valorParcela}
              onChangeText={setValorParcela}
              keyboardType="decimal-pad"
            />
            <Text style={styles.label}>Dia do vencimento (1-31)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ex: 10" 
              value={diaVencimento}
              onChangeText={setDiaVencimento}
              keyboardType="numeric"
            />
          </View>
        )}

        <TouchableOpacity 
          style={styles.botaoSalvar} 
          onPress={salvarProcesso}
          disabled={salvando}
        >
          <Text style={styles.textoBotao}>
            {salvando ? 'Salvando...' : 'Salvar Processo'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#4a0e0e', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  botaoVoltar: { alignSelf: 'flex-start', backgroundColor: 'rgba(212, 175, 55, 0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginBottom: 12 },
  voltarTexto: { color: '#d4af37', fontSize: 16, fontWeight: '600' },
  titulo: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  conteudo: { padding: 20 },
  subtitulo: { fontSize: 16, fontWeight: 'bold', color: '#4a0e0e', marginBottom: 12, marginTop: 10 },
  pickerContainer: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginBottom: 16, overflow: 'hidden' },
  picker: { height: 50, width: '100%' },
  input: { backgroundColor: '#fff', padding: 14, borderRadius: 8, fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: '#ddd' },
  textArea: { height: 100, textAlignVertical: 'top' },
  botaoSalvar: { backgroundColor: '#4a0e0e', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  textoBotao: { color: '#d4af37', fontWeight: 'bold', fontSize: 16 },
  vazio: { color: '#999', fontStyle: 'italic', padding: 10 },
  divisor: { height: 1, backgroundColor: '#e0e0e0', marginVertical: 20 },
  toggleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  toggleTexto: { fontSize: 16, color: '#333', fontWeight: '600', flex: 1 },
  camposPagamento: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#d4af37' },
  label: { fontSize: 14, color: '#666', marginBottom: 6 },
  clienteFixo: { backgroundColor: '#f0f0f0', padding: 14, borderRadius: 10, marginBottom: 16 },
  clienteNome: { fontSize: 16, fontWeight: '600', color: '#333' },
  clienteId: { fontSize: 12, color: '#999' },
});