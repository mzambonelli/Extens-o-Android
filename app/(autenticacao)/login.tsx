import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { esquemaLogin } from '@/lib/validacoes';
import { usarAutenticacao } from '@/store/autenticacao';
import { useState } from 'react';
import { clienteSupabase } from '@/lib/supabase';

type DadosLogin = { email: string; senha: string };

export default function TelaLogin() {
  const { entrar } = usarAutenticacao();
  const [processando, setProcessando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  
  const { control, handleSubmit, formState: { errors } } = useForm<DadosLogin>({
    resolver: zodResolver(esquemaLogin),
    defaultValues: { email: '', senha: '' }
  });

  const aoSubmeter = async (dados: DadosLogin) => {
    setProcessando(true);
    
    try {
      const { data: authData, error: authError } = await clienteSupabase.auth.signInWithPassword({
        email: dados.email,
        password: dados.senha,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Usuário não encontrado');

      const { data: perfil } = await clienteSupabase
        .from('perfis')
        .select('perfil')
        .eq('id', authData.user.id)
        .maybeSingle();

      
      if (!perfil) {
        await clienteSupabase.auth.signOut();
        Alert.alert('Acesso Negado', 'Este e-mail não está cadastrado no sistema.');
        return;
      }

      await entrar(dados.email, dados.senha);
      
      if (perfil.perfil === 'advogado') {
        router.replace('/(advogado)/' as any);
      } else {
        router.replace('/(cliente)/' as any);
      }

    } catch (erro: any) {
      console.error('Erro no login:', erro);
      Alert.alert('Erro no Acesso', erro.message || 'Verifique seu e-mail e senha.');
    } finally {
      setProcessando(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <View style={styles.marca}>
        <Text style={styles.balanca}>⚖️</Text>
        <Text style={styles.nomeAdvocacia}>J Silva</Text>
        <Text style={styles.subtitulo}>ADVOCACIA</Text>
      </View>

      <View style={styles.formulario}>
        <View style={styles.campo}>
          <Text style={styles.label}>E-mail</Text>
          <Controller 
            control={control} 
            name="email" 
            render={({ field: { onChange, onBlur, value } }) => (
              <View>
                <TextInput 
                  placeholder="seu@email.com" 
                  keyboardType="email-address" 
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  style={[styles.input, errors.email && styles.inputErro]} 
                />
                {errors.email && <Text style={styles.textoErro}>{errors.email.message}</Text>}
              </View>
            )} 
          />
        </View>

        <View style={styles.campo}>
          <Text style={styles.label}>Senha</Text>
          <Controller 
            control={control} 
            name="senha" 
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <TextInput 
                  placeholder="••••••" 
                  secureTextEntry={!mostrarSenha}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  style={[styles.input, styles.inputSenha, errors.senha && styles.inputErro]} 
                />
                <TouchableOpacity style={styles.olho} onPress={() => setMostrarSenha(!mostrarSenha)}>
                  <Text style={styles.olhoTexto}>{mostrarSenha ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            )} 
          />
          {errors.senha && <Text style={styles.textoErro}>{errors.senha.message}</Text>}
        </View>

        <TouchableOpacity 
          onPress={handleSubmit(aoSubmeter)} 
          disabled={processando}
          style={[styles.botaoEntrar, processando && styles.botaoDesativado]}
        >
          {processando ? <ActivityIndicator color="#4a0e0e" /> : <Text style={styles.textoBotao}>Entrar</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.linkAgendamento} onPress={() => router.push('/(autenticacao)/cadastro' as any)}>
        <Text style={styles.textoAgendamento}>Caso não seja cliente, agende aqui sua consulta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#4a0e0e' },
  conteudo: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40, justifyContent: 'center' },
  marca: { alignItems: 'center', marginBottom: 48 },
  balanca: { fontSize: 80, marginBottom: 16 },
  nomeAdvocacia: { fontSize: 42, fontWeight: 'bold', color: '#d4af37', textAlign: 'center' },
  subtitulo: { fontSize: 18, color: '#d4af37', letterSpacing: 8, textAlign: 'center', marginTop: 8 },
  formulario: { backgroundColor: '#4a0e0e' },
  campo: { marginBottom: 20 },
  label: { fontSize: 14, color: '#d4af37', marginBottom: 8, fontWeight: '600' },
  inputContainer: { position: 'relative' },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 16, fontSize: 16, color: '#333', borderWidth: 2, borderColor: 'transparent' },
  inputSenha: { paddingRight: 50 },
  olho: { position: 'absolute', right: 16, top: 16, padding: 4 },
  olhoTexto: { fontSize: 20 },
  inputErro: { borderColor: '#ff6b6b', borderWidth: 2 },
  textoErro: { color: '#ff6b6b', fontSize: 12, marginTop: 4 },
  botaoEntrar: { backgroundColor: '#d4af37', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  botaoDesativado: { backgroundColor: '#8b8b8b' },
  textoBotao: { color: '#4a0e0e', fontWeight: 'bold', fontSize: 18 },
  linkAgendamento: { marginTop: 40, alignItems: 'center' },
  textoAgendamento: { color: '#d4af37', fontSize: 14, textAlign: 'center', textDecorationLine: 'underline' },
});