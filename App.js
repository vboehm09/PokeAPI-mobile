import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const TYPE_ALIASES = {
  normal: 'normal',
  normaltype: 'normal',
  fogo: 'fire',
  fire: 'fire',
  agua: 'water',
  água: 'water',
  water: 'water',
  eletrico: 'electric',
  elétrico: 'electric',
  electric: 'electric',
  grama: 'grass',
  grass: 'grass',
  planta: 'grass',
  ice: 'ice',
  gelo: 'ice',
  lutador: 'fighting',
  fighting: 'fighting',
  veneno: 'poison',
  poison: 'poison',
  terra: 'ground',
  ground: 'ground',
  voador: 'flying',
  flying: 'flying',
  psicico: 'psychic',
  psíquico: 'psychic',
  psychic: 'psychic',
  inseto: 'bug',
  bug: 'bug',
  pedra: 'rock',
  rock: 'rock',
  fantasma: 'ghost',
  ghost: 'ghost',
  dragao: 'dragon',
  dragão: 'dragon',
  dragon: 'dragon',
  dark: 'dark',
  sombrio: 'dark',
  sinistro: 'dark',
  metal: 'steel',
  steel: 'steel',
  fada: 'fairy',
  fairy: 'fairy',
};

const TYPE_COLORS = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  dark: '#705746',
  steel: '#B7B7CE',
  fairy: '#D685AD',
};

const normalizeText = (value) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const resolveTypeName = (value) => TYPE_ALIASES[normalizeText(value)] || normalizeText(value);

const getTypeColor = (typeName) => TYPE_COLORS[normalizeText(typeName)] || '#64748B';

const getReadableTextColor = (hexColor) => {
  const color = hexColor.replace('#', '');
  const red = parseInt(color.slice(0, 2), 16);
  const green = parseInt(color.slice(2, 4), 16);
  const blue = parseInt(color.slice(4, 6), 16);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

  return brightness > 150 ? '#111827' : '#FFFFFF';
};

export default function App() {
  const [searchMode, setSearchMode] = useState('name');
  const [pokemonName, setPokemonName] = useState('pikachu');
  const [pokemonType, setPokemonType] = useState('electric');
  const [pokemon, setPokemon] = useState(null);
  const [typePokemons, setTypePokemons] = useState([]);
  const [typeInfo, setTypeInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const buildPokemonCard = (data) => ({
    id: data.id,
    name: data.name,
    image:
      data.sprites.other?.['official-artwork']?.front_default || data.sprites.front_default || null,
    height: (data.height / 10).toFixed(1),
    weight: (data.weight / 10).toFixed(1),
    types: data.types.map((typeEntry) => typeEntry.type.name),
    abilities: data.abilities.map((abilityEntry) => abilityEntry.ability.name),
    primaryType: data.types[0]?.type?.name || 'normal',
  });

  const fetchPokemon = async (name) => {
    const query = normalizeText(name);

    if (!query) {
      setError('Digite o nome de um Pokémon.');
      setPokemon(null);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);

      if (!response.ok) {
        throw new Error('Pokémon não encontrado. Verifique o nome e tente novamente.');
      }

      const data = await response.json();
      setPokemon(data);
    } catch (fetchError) {
      setPokemon(null);
      setError(fetchError.message || 'Ocorreu um erro ao buscar os dados.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPokemonByType = async (typeName) => {
    const query = resolveTypeName(typeName);

    if (!query) {
      setError('Digite um tipo de Pokémon.');
      setTypeInfo(null);
      setTypePokemons([]);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setPokemon(null);
      setTypeInfo(null);
      setTypePokemons([]);

      const response = await fetch(`https://pokeapi.co/api/v2/type/${query}`);

      if (!response.ok) {
        throw new Error('Tipo não encontrado. Use exemplos como fire, water ou electric.');
      }

      const data = await response.json();

      const detailedPokemons = await Promise.all(
        data.pokemon.map(async (entry) => {
          const pokemonResponse = await fetch(entry.pokemon.url);

          if (!pokemonResponse.ok) {
            return null;
          }

          const pokemonData = await pokemonResponse.json();
          return buildPokemonCard(pokemonData);
        }),
      );

      setTypeInfo({
        typeName: data.name,
        doubleDamageTo: data.damage_relations.double_damage_to.map((item) => item.name),
        doubleDamageFrom: data.damage_relations.double_damage_from.map((item) => item.name),
      });
      setTypePokemons(detailedPokemons.filter(Boolean));
    } catch (fetchError) {
      setTypeInfo(null);
      setTypePokemons([]);
      setError(fetchError.message || 'Ocorreu um erro ao buscar os dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPokemon('pikachu');
  }, []);

  const handleSearch = () => {
    Keyboard.dismiss();
    if (searchMode === 'type') {
      fetchPokemonByType(pokemonType);
      return;
    }

    setTypeInfo(null);
    setTypePokemons([]);
    fetchPokemon(pokemonName);
  };

  const renderPokemonCard = (pokemonData) => (
    <View
      key={pokemonData.id}
      style={[
        styles.resultCard,
        {
          borderTopWidth: 4,
          borderTopColor: getTypeColor(pokemonData.primaryType),
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pokemonName}>{pokemonData.name}</Text>
          <Text style={styles.pokemonId}>#{String(pokemonData.id).padStart(3, '0')}</Text>
        </View>

        {pokemonData.image ? <Image source={{ uri: pokemonData.image }} style={styles.pokemonImage} /> : null}
      </View>

      <View style={styles.typeChipsRow}>
        {pokemonData.types.map((typeName) => {
          const chipColor = getTypeColor(typeName);
          const chipTextColor = getReadableTextColor(chipColor);

          return (
            <View key={typeName} style={[styles.typeChip, { backgroundColor: chipColor }]}>
              <Text style={[styles.typeChipText, { color: chipTextColor }]}>{typeName}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Altura</Text>
          <Text style={styles.infoValue}>{pokemonData.height} m</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Peso</Text>
          <Text style={styles.infoValue}>{pokemonData.weight} kg</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Habilidades</Text>
          <Text style={styles.infoValue}>{pokemonData.abilities.join(', ')}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.titleRow}>
          <Image source={require('./assets/pokebola.png')} style={styles.pokeballImage} />
          <Text style={styles.title}>Pokédex Mobile</Text>
        </View>
        <Text style={styles.subtitle}>Busque Pokémon pelo nome ou explore todos os Pokémon de um tipo específico.</Text>

        <View style={styles.card}>
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeButton, searchMode === 'name' && styles.modeButtonActive]}
              onPress={() => setSearchMode('name')}
              activeOpacity={0.85}
            >
              <Text style={[styles.modeButtonText, searchMode === 'name' && styles.modeButtonTextActive]}>
                Por nome
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeButton, searchMode === 'type' && styles.modeButtonActive]}
              onPress={() => setSearchMode('type')}
              activeOpacity={0.85}
            >
              <Text style={[styles.modeButtonText, searchMode === 'type' && styles.modeButtonTextActive]}>
                Por tipo
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>{searchMode === 'name' ? 'Nome do Pokémon' : 'Tipo do Pokémon'}</Text>
          {searchMode === 'name' ? (
            <TextInput
              style={styles.input}
              placeholder="Ex.: pikachu"
              placeholderTextColor="#8B97A7"
              value={pokemonName}
              onChangeText={setPokemonName}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
          ) : (
            <TextInput
              style={styles.input}
              placeholder="Ex.: electric"
              placeholderTextColor="#8B97A7"
              value={pokemonType}
              onChangeText={setPokemonType}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
          )}

          <TouchableOpacity style={styles.button} onPress={handleSearch} activeOpacity={0.85}>
            <Text style={styles.buttonText}>
              {searchMode === 'name' ? 'Buscar dados' : 'Buscar por tipo'}
            </Text>
          </TouchableOpacity>

          {loading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator size="large" color="#F7C948" />
              <Text style={styles.stateText}>Carregando dados...</Text>
            </View>
          ) : null}

          {error ? (
            <View style={[styles.stateBox, styles.errorBox]}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {pokemon && !loading && !error ? renderPokemonCard(buildPokemonCard(pokemon)) : null}

          {typeInfo && !loading && !error ? (
            <View style={styles.resultCard}>
              <Text style={styles.pokemonName}>{typeInfo.typeName} type</Text>
              <Text style={styles.typeSummary}>Pokémon encontrados: {typePokemons.length}</Text>

              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Dano forte contra</Text>
                  <View style={styles.typeChipsRow}>
                    {typeInfo.doubleDamageTo.length > 0 ? (
                      typeInfo.doubleDamageTo.map((typeName) => {
                        const chipColor = getTypeColor(typeName);
                        const chipTextColor = getReadableTextColor(chipColor);

                        return (
                          <View key={typeName} style={[styles.typeChip, { backgroundColor: chipColor }]}>
                            <Text style={[styles.typeChipText, { color: chipTextColor }]}>{typeName}</Text>
                          </View>
                        );
                      })
                    ) : (
                      <Text style={styles.infoValue}>Nenhum</Text>
                    )}
                  </View>
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Dano forte recebido de</Text>
                  <View style={styles.typeChipsRow}>
                    {typeInfo.doubleDamageFrom.length > 0 ? (
                      typeInfo.doubleDamageFrom.map((typeName) => {
                        const chipColor = getTypeColor(typeName);
                        const chipTextColor = getReadableTextColor(chipColor);

                        return (
                          <View key={typeName} style={[styles.typeChip, { backgroundColor: chipColor }]}>
                            <Text style={[styles.typeChipText, { color: chipTextColor }]}>{typeName}</Text>
                          </View>
                        );
                      })
                    ) : (
                      <Text style={styles.infoValue}>Nenhum</Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          {typeInfo && !loading && !error
            ? typePokemons.map((pokemonData) => renderPokemonCard(pokemonData))
            : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B1020',
  },
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#0B1020',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  pokeballImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  subtitle: {
    color: '#B8C2D1',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#121A2C',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  modeButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#0B1020',
  },
  modeButtonActive: {
    backgroundColor: '#F7C948',
    borderColor: '#F7C948',
  },
  modeButtonText: {
    color: '#D7DEEA',
    fontSize: 14,
    fontWeight: '700',
  },
  modeButtonTextActive: {
    color: '#111827',
  },
  label: {
    color: '#D7DEEA',
    fontSize: 14,
    marginBottom: 10,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#0B1020',
    color: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    fontSize: 16,
  },
  button: {
    marginTop: 14,
    backgroundColor: '#F7C948',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
  },
  stateBox: {
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#0B1020',
    alignItems: 'center',
    gap: 10,
  },
  stateText: {
    color: '#D7DEEA',
    fontSize: 15,
  },
  errorBox: {
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
  },
  errorText: {
    color: '#FCA5A5',
    textAlign: 'center',
    fontSize: 15,
  },
  resultCard: {
    marginTop: 18,
    backgroundColor: '#0B1020',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  pokemonName: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  pokemonId: {
    color: '#F7C948',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '700',
  },
  pokemonImage: {
    width: 112,
    height: 112,
  },
  typeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  typeChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'capitalize',
    letterSpacing: 0.4,
  },
  infoGrid: {
    marginTop: 20,
    gap: 12,
  },
  infoItem: {
    backgroundColor: '#121A2C',
    borderRadius: 16,
    padding: 14,
  },
  infoLabel: {
    color: '#8EA0BA',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    fontWeight: '700',
  },
  infoValue: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
  },
  typeSummary: {
    color: '#D7DEEA',
    marginTop: 6,
    fontSize: 14,
    marginBottom: 6,
  },
});
