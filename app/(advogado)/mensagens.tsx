import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { clienteSupabase } from '@/lib/supabase';

type Conversa = {
  cliente_id: string;
  cliente_nome: string;
  ultima_mensagem: string;
  data_ultima: string;
  nao_lidas: number;
};

export default function MensagensAdvogado() {
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregarConversas = useCallback(async () => {
    try {
      console.log('Buscando conversas...');
      
      const { data: mensagensData, error: msgsError } = await clienteSupabase
        .from('mensagens')
        .select('*')
        .order('created_at', { ascending: false });

      if (msgsError) {
        console.error('❌ Erro ao buscar mensagens:', msgsError);
        throw msgsError;
      }

      if (!mensagensData || mensagensData.length === 0) {
        setConversas([]);
        return;
      }

      const clientesIds = [...new Set(mensagensData.map(m => m.cliente_id))];
      
      const { data: perfisData } = await clienteSupabase
        .from('perfis')
        .select('id, nome')
        .in('id', clientesIds);

      const perfisMap = new Map();
      perfisData?.forEach(p => perfisMap.set(p.id, p.nome));

      const conversasMap = new Map<string, Conversa>();
      
      mensagensData.forEach((msg: any) => {
        const id = msg.cliente_id;
        const nome = perfisMap.get(id) || 'Cliente';
        
        if (!conversasMap.has(id)) {
          conversasMap.set(id, {
            cliente_id: id,
            cliente_nome: nome,
            ultima_mensagem: msg.mensagem,
            data_ultima: msg.created_at,
            nao_lidas: (!msg.lida && msg.remetente === 'cliente') ? 1 : 0,
          });
        } else if (!msg.lida && msg.remetente === 'cliente') {
          const ex = conversasMap.get(id);
          if (ex) {
            ex.nao_lidas += 1;
            conversasMap.set(id, ex);
          }
        }
      });

      const resultado = Array.from(conversasMap.values());
      console.log('📊 Contadores calculados:', resultado.map(c => `${c.cliente_nome}: ${c.nao_lidas}`));
      
      setConversas(resultado);
    } catch (erro) {
      console.error('❌ Erro ao carregar:', erro);
      setConversas([]);
    } finally {
      setCarregando(false);
      setRefreshing(false);
    }
  }, []);
   useFocusEffect(
    useCallback(() => {
      console.log('Tela em foco!');
      
      carregarConversas();
      
      const intervalo = setInterval(() => {
        carregarConversas();
      }, 3000);

      return () => {
        console.log('Limpando polling');
        clearInterval(intervalo);
      };
    }, [carregarConversas])
  );

  const onRefresh = () => {
    setRefreshing(true);
    carregarConversas();
  };

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    const agora = new Date();
    const diff = agora.getTime() - data.getTime();
    const horas = Math.floor(diff / (1000 * 60 * 60));
    
    if (horas < 1) return 'Agora';
    if (horas < 24) return `${horas}h atrás`;
    return data.toLocaleDateString('pt-BR');
  };

  const abrirConversa = (clienteId: string) => {
    router.push(`/(advogado)/conversa/${clienteId}` as any);
  };

  if (carregando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d4af37" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#d4af37" />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.voltar}>
          <Text style={styles.voltarTexto}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.balanca}>💬</Text>
        <Text style={styles.nomeAdvocacia}>J Silva</Text>
        <Text style={styles.subtitulo}>ADVOCACIA</Text>
        <Text style={styles.titulo}>Mensagens</Text>
      </View>

        <View style={styles.conteudo}>
        {conversas.length > 0 && (
          <Text style={styles.secaoTitulo}>
            {conversas.reduce((acc, c) => acc + c.nao_lidas, 0)} Não lida
            {conversas.reduce((acc, c) => acc + c.nao_lidas, 0) !== 1 ? 's' : ''}
          </Text>
        )}
        
        {conversas.length === 0 ? (
          <View style={styles.vazio}>
            <Text style={styles.emojiVazio}>📭</Text>
            <Text style={styles.textoVazio}>Nenhuma mensagem</Text>
            <Text style={styles.subtextoVazio}>
              As conversas com seus clientes aparecerão aqui.
            </Text>
          </View>
        ) : (
          conversas.map((conv) => (
            <TouchableOpacity 
              key={`${conv.cliente_id}-${conv.nao_lidas}`}
              style={styles.card}
              onPress={() => abrirConversa(conv.cliente_id)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarTexto}>{conv.cliente_nome.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.conteudoCard}>
                  <View style={styles.linhaSuperior}>
                    <Text style={styles.nomeCliente}>{conv.cliente_nome}</Text>
                    <Text style={styles.data}>{formatarData(conv.data_ultima)}</Text>
                  </View>
                  <Text style={styles.ultimaMensagem} numberOfLines={1}>
                    {conv.ultima_mensagem}
                  </Text>
                </View>
                {conv.nao_lidas > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.textoBadge}>{conv.nao_lidas}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#4a0e0e' },
  header: { backgroundColor: '#4a0e0e', padding: 24, paddingTop: 60, alignItems: 'center', paddingBottom: 32 },
  voltar: { position: 'absolute', top: 60, left: 24, padding: 8 },
  voltarTexto: { color: '#d4af37', fontSize: 16, fontWeight: '600' },
  balanca: { fontSize: 60, marginBottom: 12 },
  nomeAdvocacia: { fontSize: 32, fontWeight: 'bold', color: '#d4af37' },
  subtitulo: { fontSize: 14, color: '#d4af37', letterSpacing: 6, marginTop: 4, marginBottom: 20 },
  titulo: { fontSize: 24, color: '#fff', fontWeight: 'bold' },
  conteudo: { padding: 16 },
  secaoTitulo: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  vazio: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emojiVazio: { fontSize: 64, marginBottom: 16 },
  textoVazio: { fontSize: 18, fontWeight: '600', color: '#666', textAlign: 'center', marginBottom: 8 },
  subtextoVazio: { fontSize: 14, color: '#999', textAlign: 'center' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#d4af37', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarTexto: { fontSize: 20, fontWeight: 'bold', color: '#4a0e0e' },
  conteudoCard: { flex: 1 },
  linhaSuperior: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  nomeCliente: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  data: { fontSize: 12, color: '#999' },
  ultimaMensagem: { fontSize: 14, color: '#666' },
  badge: { backgroundColor: '#d4af37', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  textoBadge: { color: '#4a0e0e', fontSize: 12, fontWeight: 'bold' },
});