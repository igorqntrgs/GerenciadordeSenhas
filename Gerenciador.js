import React, { useState, useEffect } from 'react';
import { View, Text, Button, TextInput, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SQLite from 'react-native-sqlite-storage';

// Constantes para evitar strings mágicas
const NOME_BANCO = 'senhas.db';
const CHAVE_SENHA = '@meuApp:senha';
const NOME_TABELA = 'Senhas';

// Abrindo o banco de dados
const db = SQLite.openDatabase(
  { name: NOME_BANCO, location: 'default' },
  () => console.log('Banco de dados aberto'),
  (err) => console.error('Erro ao abrir o banco de dados', err)
);

const GerenciadorSenhas = () => {
  const [senha, setSenha] = useState('');
  const [ultimaSenhaSalva, setUltimaSenhaSalva] = useState('');
  const [recuperandoSenha, setRecuperandoSenha] = useState(false);

  useEffect(() => {
    criarTabela();
    recuperarSenha();
  }, []);

  const criarTabela = () => {
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS ${NOME_TABELA} (id INTEGER PRIMARY KEY AUTOINCREMENT, senha TEXT);`,
        [],
        () => console.log('Tabela criada com sucesso'),
        (tx, error) => console.error('Erro ao criar tabela:', error)
      );
    });
  };

  const gerarSenha = () => {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let novaSenha = '';
    for (let i = 0; i < 8; i++) {
      const indiceAleatorio = Math.floor(Math.random() * caracteres.length);
      novaSenha += caracteres[indiceAleatorio];
    }
    setSenha(novaSenha);
    salvarSenha(novaSenha);
  };

  const salvarSenha = async (novaSenha) => {
    try {
      await new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            `INSERT INTO ${NOME_TABELA} (senha) VALUES (?);`,
            [novaSenha],
            resolve,
            (tx, error) => reject(error)
          );
        });
      });
      await AsyncStorage.setItem(CHAVE_SENHA, novaSenha);
      setUltimaSenhaSalva(novaSenha);
      console.log('Senha salva com sucesso');
    } catch (erro) {
      console.error('Erro ao salvar a senha:', erro);
    }
  };

  const recuperarSenha = async () => {
    try {
      setRecuperandoSenha(true);
      const result = await new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            `SELECT senha FROM ${NOME_TABELA} ORDER BY id DESC LIMIT 1;`,
            [],
            (tx, results) => resolve(results),
            (tx, error) => reject(error)
          );
        });
      });

      if (result.rows.length > 0) {
        const senhaSalva = result.rows.item(0).senha;
        setSenha(senhaSalva);
        setUltimaSenhaSalva(senhaSalva);
      } else {
        Alert.alert('Nenhuma senha salva encontrada');
      }
    } catch (erro) {
      console.error('Erro ao recuperar a senha:', erro);
    } finally {
      setRecuperandoSenha(false);
    }
  };

  return (
    <View style={estilos.container}>
      <Text style={estilos.rotulo}>Senha:</Text>
      <Text style={estilos.senha}>{senha}</Text>

      <TextInput
        style={estilos.input}
        value={recuperandoSenha ? 'Recuperando senha...' : ultimaSenhaSalva}
        placeholder="Última senha salva"
        editable={false}
      />

      <View style={estilos.containerBotoes}>
        <Button title="Gerar Nova Senha" onPress={gerarSenha} />
        <View style={estilos.espacamentoBotao} />
        <Button title="Recuperar Senha Salva" onPress={recuperarSenha} />
      </View>
    </View>
  );
};

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  rotulo: {
    fontSize: 18,
    marginBottom: 10,
  },
  senha: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 40,
    paddingHorizontal: 10,
    marginBottom: 20,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
  },
  containerBotoes: {
    marginTop: 20,
  },
  espacamentoBotao: {
    marginVertical: 10,
  },
});

export default GerenciadorSenhas;
