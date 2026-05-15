import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Animated,
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Easing,
  Keyboard,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, G, Line, Polygon, Text as SvgText } from 'react-native-svg';

let ExpoSpeechRecognitionModule = null;
let useSpeechRecognitionEvent = () => {};

try {
  const speechRecognition = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = speechRecognition.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = speechRecognition.useSpeechRecognitionEvent;
} catch {
  ExpoSpeechRecognitionModule = null;
  useSpeechRecognitionEvent = () => {};
}

const TYPE_ALIASES = {
  normal: 'normal',
  normaltype: 'normal',
  fogo: 'fire',
  fire: 'fire',
  agua: 'water',
  'água': 'water',
  water: 'water',
  eletrico: 'electric',
  'elétrico': 'electric',
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
  'psíquico': 'psychic',
  psychic: 'psychic',
  inseto: 'bug',
  bug: 'bug',
  pedra: 'rock',
  rock: 'rock',
  fantasma: 'ghost',
  ghost: 'ghost',
  dragao: 'dragon',
  'dragão': 'dragon',
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
  flying: '#c3e1eb',
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

const resolveGenerationQuery = (value) => {
  const normalized = normalizeText(value)
    .replace(/^geracao\s*/i, '')
    .replace(/^generation\s*/i, '');

  const GENERATION_ALIASES = {
    '1': '1', i: '1', kanto: '1',
    '2': '2', ii: '2', johto: '2',
    '3': '3', iii: '3', hoenn: '3',
    '4': '4', iv: '4', sinnoh: '4',
    '5': '5', v: '5', unova: '5',
    '6': '6', vi: '6', kalos: '6',
    '7': '7', vii: '7', alola: '7',
    '8': '8', viii: '8', galar: '8',
    '9': '9', ix: '9', paldea: '9',
  };

  return GENERATION_ALIASES[normalized] || normalized;
};

const STAT_LABELS = {
  hp: 'HP',
  attack: 'Atk',
  defense: 'Def',
  'special-attack': 'SpA',
  'special-defense': 'SpD',
  speed: 'Spe',
};

const STAT_KEYS = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];
const POKEMON_BATCH_SIZE = 20;
const FAVORITES_STORAGE_KEY = '@pokeapi-mobile:favorites';
const VOICE_HISTORY_STORAGE_KEY = '@pokeapi-mobile:voiceHistory';

const THEMES = {
  dark: {
    id: 'dark',
    screen: '#0B1020',
    card: '#121A2C',
    surface: '#0B1020',
    text: '#F8FAFC',
    mutedText: '#B8C2D1',
    border: 'rgba(255,255,255,0.08)',
    subBorder: 'rgba(255,255,255,0.1)',
    inputBg: '#0B1020',
    infoBg: '#121A2C',
    stateBg: '#0B1020',
    chartGrid: 'rgba(255,255,255,0.14)',
    chartAxis: 'rgba(255,255,255,0.18)',
    chartLabel: '#F8FAFC',
    activeText: '#111827',
    inactiveText: '#D7DEEA',
    shadow: '#000',
  },
  light: {
    id: 'light',
    screen: '#F5F7FB',
    card: '#FFFFFF',
    surface: '#F5F7FB',
    text: '#0F172A',
    mutedText: '#475569',
    border: 'rgba(15,23,42,0.08)',
    subBorder: 'rgba(15,23,42,0.12)',
    inputBg: '#FFFFFF',
    infoBg: '#F1F5F9',
    stateBg: '#E2E8F0',
    chartGrid: 'rgba(15,23,42,0.12)',
    chartAxis: 'rgba(15,23,42,0.18)',
    chartLabel: '#0F172A',
    activeText: '#0F172A',
    inactiveText: '#334155',
    shadow: '#94A3B8',
  },
};

const getTypeColor = (typeName) => TYPE_COLORS[normalizeText(typeName)] || '#64748B';

const getReadableTextColor = (hexColor) => {
  const color = hexColor.replace('#', '');
  const red = parseInt(color.slice(0, 2), 16);
  const green = parseInt(color.slice(2, 4), 16);
  const blue = parseInt(color.slice(4, 6), 16);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
  return brightness > 150 ? '#111827' : '#FFFFFF';
};

const getVoiceErrorMessage = (code) => {
  const messages = {
    aborted: 'Gravação cancelada.',
    'audio-capture': 'Não consegui acessar o microfone.',
    interrupted: 'A gravação foi interrompida.',
    'language-not-supported': 'O idioma selecionado não é suportado.',
    network: 'Falha de rede durante o reconhecimento.',
    'no-speech': 'Não ouvi nenhuma fala clara.',
    'not-allowed': 'Permissão de microfone ou voz negada.',
    'service-not-allowed': 'O reconhecimento de voz não está disponível neste dispositivo.',
    busy: 'O microfone já está em uso. Tente novamente.',
    client: 'Ocorreu um erro local no reconhecimento de voz.',
    'speech-timeout': 'Tempo de escuta expirou.',
    unknown: 'Não consegui reconhecer a fala.',
  };

  return messages[code] || 'Não consegui reconhecer a fala.';
};

const hexToRgba = (hexColor, alpha) => {
  const color = hexColor.replace('#', '');
  const red = parseInt(color.slice(0, 2), 16);
  const green = parseInt(color.slice(2, 4), 16);
  const blue = parseInt(color.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const parseEvolutionNames = (chain) => {
  const names = [];
  let current = chain;
  while (current) {
    names.push(current.species.name);
    current = current.evolves_to?.[0] ?? null;
  }
  return names;
};

const buildPokemonCard = (data, evolutions = []) => {
  const stats = {};
  data.stats.forEach((s) => {
    stats[s.stat.name] = s.base_stat;
  });

  return {
    id: data.id,
    name: data.name,
    types: data.types.map((t) => t.type.name),
    primaryType: data.types[0]?.type.name ?? 'normal',
    height: (data.height / 10).toFixed(1),
    weight: (data.weight / 10).toFixed(1),
    abilities: data.abilities.map((a) => a.ability.name),
    stats,
    cry: data.cries?.latest ?? null,
    images: {
      official: data.sprites.other?.['official-artwork']?.front_default ?? data.sprites.front_default ?? null,
      classic: data.sprites.front_default ?? null,
      shiny: data.sprites.other?.['official-artwork']?.front_shiny ?? data.sprites.front_shiny ?? null,
    },
    image: data.sprites.other?.['official-artwork']?.front_default ?? data.sprites.front_default ?? null,
    evolutions,
  };
};

const fetchEvolutionChain = async (speciesUrl) => {
  try {
    if (!speciesUrl) return [];

    const speciesResponse = await fetch(speciesUrl);
    if (!speciesResponse.ok) return [];

    const speciesData = await speciesResponse.json();
    const evolutionUrl = speciesData.evolution_chain?.url;
    if (!evolutionUrl) return [];

    const evolutionResponse = await fetch(evolutionUrl);
    if (!evolutionResponse.ok) return [];

    const evolutionData = await evolutionResponse.json();
    const evolutionNames = parseEvolutionNames(evolutionData.chain);

    const evolutionCards = await Promise.all(
      evolutionNames.map(async (name) => {
        const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
        if (!pokemonResponse.ok) return { id: name, name, image: null };
        const pokemonData = await pokemonResponse.json();
        return {
          id: pokemonData.id,
          name: pokemonData.name,
          image: pokemonData.sprites.other?.['official-artwork']?.front_default ?? pokemonData.sprites.front_default ?? null,
        };
      }),
    );

    return evolutionCards;
  } catch {
    return [];
  }
};

const RadarChart = ({ stats, color, theme }) => {
  const size = 240;
  const center = size / 2;
  const radius = 78;
  const values = STAT_KEYS.map((k) => stats?.[k] ?? 0);
  const maxValue = Math.max(100, ...values);
  const angleStep = (Math.PI * 2) / STAT_KEYS.length;
  const ringSteps = [0.25, 0.5, 0.75, 1];

  const pointAt = (value, index) => {
    const ratio = value / maxValue;
    const angle = -Math.PI / 2 + index * angleStep;
    const x = center + Math.cos(angle) * radius * ratio;
    const y = center + Math.sin(angle) * radius * ratio;
    return `${x},${y}`;
  };

  const ringPoints = (ring) =>
    STAT_KEYS.map((_, index) => {
      const angle = -Math.PI / 2 + index * angleStep;
      const x = center + Math.cos(angle) * radius * ring;
      const y = center + Math.sin(angle) * radius * ring;
      return `${x},${y}`;
    }).join(' ');

  return (
    <View style={styles.radarWrap}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {ringSteps.map((ring) => (
          <Polygon key={ring} points={ringPoints(ring)} fill="none" stroke={theme.chartGrid} strokeWidth="1" />
        ))}
        {STAT_KEYS.map((statKey, index) => {
          const angle = -Math.PI / 2 + index * angleStep;
          const lineX = center + Math.cos(angle) * radius;
          const lineY = center + Math.sin(angle) * radius;
          const labelX = center + Math.cos(angle) * (radius + 18);
          const labelY = center + Math.sin(angle) * (radius + 18);
          const textAnchor = Math.abs(Math.cos(angle)) < 0.25 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end';

          return (
            <G key={statKey}>
              <Line x1={center} y1={center} x2={lineX} y2={lineY} stroke={theme.chartAxis} strokeWidth="1" />
              <SvgText
                x={labelX}
                y={labelY}
                fill={theme.chartLabel}
                fontSize="10"
                fontWeight="700"
                textAnchor={textAnchor}
                dominantBaseline="middle"
              >
                {STAT_LABELS[statKey]}
              </SvgText>
            </G>
          );
        })}
        <Polygon
          points={STAT_KEYS.map((k, i) => pointAt(stats?.[k] ?? 0, i)).join(' ')}
          fill={hexToRgba(color, 0.42)}
          stroke={color}
          strokeWidth="3"
        />
        {STAT_KEYS.map((statKey, index) => {
          const [cx, cy] = pointAt(stats?.[statKey] ?? 0, index).split(',');
          return <Circle key={statKey} cx={Number(cx)} cy={Number(cy)} r="4" fill="#FFFFFF" stroke={color} strokeWidth="2" />;
        })}
      </Svg>
    </View>
  );
};

const AudioPlayIcon = ({ color }) => (
  <Svg width={28} height={28} viewBox="0 0 28 28">
    <Circle cx="14" cy="14" r="13" fill="rgba(255,255,255,0.16)" />
    <Polygon points="11,9 11,19 19,14" fill={color} />
  </Svg>
);

const MicIcon = ({ color }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24">
    <Circle cx="12" cy="8.5" r="4.25" fill="none" stroke={color} strokeWidth="1.8" />
    <Line x1="12" y1="13" x2="12" y2="18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <Line x1="8.25" y1="18.5" x2="15.75" y2="18.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <Line x1="7.5" y1="8.5" x2="7.5" y2="9.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <Line x1="16.5" y1="8.5" x2="16.5" y2="9.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const LoadingAnimation = ({ compact = false, theme, message }) => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [rotation]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.loadingWrap, compact && styles.loadingWrapCompact]}>
      <Animated.Image
        source={require('./assets/pokebola.png')}
        style={[compact ? styles.loadingAnimationCompact : styles.loadingAnimation, { transform: [{ rotate }] }]}
        resizeMode="contain"
      />
      {message ? <Text style={[styles.stateText, { color: theme.mutedText }]}>{message}</Text> : null}
    </View>
  );
};

export default function App() {
  const [themeMode, setThemeMode] = useState('dark');
  const [searchMode, setSearchMode] = useState('name');
  const [imageVariant, setImageVariant] = useState('official');
  const [activeScreen, setActiveScreen] = useState('search');
  const [favorites, setFavorites] = useState([]);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);

  const [pokemonName, setPokemonName] = useState('');
  const [pokemonType, setPokemonType] = useState('');
  const [pokemonGeneration, setPokemonGeneration] = useState('');
  const [pokemonIdQuery, setPokemonIdQuery] = useState('');

  const [pokemon, setPokemon] = useState(null);
  const [typeInfo, setTypeInfo] = useState(null);
  const [typePokemons, setTypePokemons] = useState([]);
  const [pokemonQueue, setPokemonQueue] = useState([]);
  const [hasMoreResults, setHasMoreResults] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [audioLoadingId, setAudioLoadingId] = useState(null);
  const [voiceStatus, setVoiceStatus] = useState('idle');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [voiceHistory, setVoiceHistory] = useState([]);
  const [voiceVolume, setVoiceVolume] = useState(0);

  const soundRef = useRef(null);
  const voicePulse = useRef(new Animated.Value(0)).current;
  const voiceRetryTimerRef = useRef(null);
  const theme = THEMES[themeMode];
  const voiceRecognitionAvailable = Boolean(ExpoSpeechRecognitionModule);

  const getPokemonImage = (pokemonData) => pokemonData.images?.[imageVariant] || pokemonData.image || null;
  const getPokemonCry = (pokemonData) => pokemonData.cry || null;

  const extractIdFromUrl = (url) => {
    if (!url) return Number.MAX_SAFE_INTEGER;
    const match = url.match(/\/(\d+)\/?$/);
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
  };

  const clearListResults = () => {
    setTypePokemons([]);
    setPokemonQueue([]);
    setHasMoreResults(false);
    setLoadingMore(false);
  };

  const addVoiceHistoryItem = (query) => {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) return;

    setVoiceHistory((currentHistory) => {
      const nextHistory = [query.trim(), ...currentHistory.filter((item) => normalizeText(item) !== normalizedQuery)];
      return nextHistory.slice(0, 5);
    });
  };

  const isFavorite = (pokemonId) => favorites.some((item) => item.id === pokemonId);

  const toggleFavorite = (pokemonData) => {
    setFavorites((currentFavorites) => {
      const alreadyFavorite = currentFavorites.some((item) => item.id === pokemonData.id);
      if (alreadyFavorite) return currentFavorites.filter((item) => item.id !== pokemonData.id);
      return [{ ...pokemonData, savedAt: Date.now() }, ...currentFavorites];
    });
  };

  const fetchPokemonBatch = async (entries, startIndex) => {
    const chunk = entries.slice(startIndex, startIndex + POKEMON_BATCH_SIZE);
    const detailed = await Promise.all(
      chunk.map(async (entry) => {
        const endpoint = entry.url || `https://pokeapi.co/api/v2/pokemon/${entry.name}`;
        const res = await fetch(endpoint);
        if (!res.ok) return null;
        const data = await res.json();
        return buildPokemonCard(data);
      }),
    );
    return detailed.filter(Boolean);
  };

  const playPokemonCry = async (pokemonData) => {
    const audioUrl = getPokemonCry(pokemonData);
    if (!audioUrl) {
      Alert.alert('Áudio indisponível', 'Este Pokémon não possui grito de áudio disponível.');
      return;
    }

    try {
      setAudioLoadingId(pokemonData.id);
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl }, { shouldPlay: true });
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          await sound.unloadAsync();
          if (soundRef.current === sound) soundRef.current = null;
        }
      });
    } catch {
      Alert.alert('Erro no áudio', 'Não foi possível tocar o grito deste Pokémon.');
    } finally {
      setAudioLoadingId(null);
    }
  };

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const storedFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
        if (storedFavorites) {
          const parsedFavorites = JSON.parse(storedFavorites);
          if (Array.isArray(parsedFavorites)) setFavorites(parsedFavorites);
        }
      } catch {
        setFavorites([]);
      } finally {
        setFavoritesLoaded(true);
      }
    };
    loadFavorites();
  }, []);

  useEffect(() => {
    const loadVoiceHistory = async () => {
      try {
        const storedHistory = await AsyncStorage.getItem(VOICE_HISTORY_STORAGE_KEY);
        if (!storedHistory) return;

        const parsedHistory = JSON.parse(storedHistory);
        if (Array.isArray(parsedHistory)) {
          setVoiceHistory(parsedHistory.filter((item) => typeof item === 'string'));
        }
      } catch {
        setVoiceHistory([]);
      }
    };

    loadVoiceHistory();
  }, []);

  useEffect(() => {
    if (!favoritesLoaded) return;
    AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites)).catch(() => {});
  }, [favorites, favoritesLoaded]);

  useEffect(() => {
    AsyncStorage.setItem(VOICE_HISTORY_STORAGE_KEY, JSON.stringify(voiceHistory)).catch(() => {});
  }, [voiceHistory]);

  useEffect(() => {
    if (voiceStatus !== 'listening') {
      voicePulse.stopAnimation();
      voicePulse.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(voicePulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(voicePulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [voicePulse, voiceStatus]);

  useEffect(() => {
    return () => {
      if (voiceRetryTimerRef.current) {
        clearTimeout(voiceRetryTimerRef.current);
        voiceRetryTimerRef.current = null;
      }
    };
  }, []);

  const fetchPokemon = async (name) => {
    const query = normalizeText(name);
    if (!query) {
      setError('Digite o nome de um Pokémon.');
      setPokemon(null);
      return false;
    }
    try {
      setLoading(true);
      setError('');
      clearListResults();
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);
      if (!response.ok) throw new Error('Pokémon não encontrado. Verifique o nome e tente novamente.');
      const data = await response.json();
      const evolutions = await fetchEvolutionChain(data.species?.url);
      setPokemon(buildPokemonCard(data, evolutions));
      return true;
    } catch (fetchError) {
      setPokemon(null);
      setError(fetchError.message || 'Ocorreu um erro ao buscar os dados.');
      return false;
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
      clearListResults();

      const response = await fetch(`https://pokeapi.co/api/v2/type/${query}`);
      if (!response.ok) throw new Error('Tipo não encontrado. Use exemplos como fire, water ou electric.');

      const data = await response.json();
      const queueEntries = data.pokemon
        .map((entry) => ({ name: entry.pokemon.name, url: entry.pokemon.url, orderId: extractIdFromUrl(entry.pokemon.url) }))
        .sort((a, b) => a.orderId - b.orderId);

      const initialBatch = await fetchPokemonBatch(queueEntries, 0);
      setTypeInfo({
        mode: 'type',
        title: `${data.name} type`,
        totalCount: queueEntries.length,
        doubleDamageTo: data.damage_relations.double_damage_to.map((i) => i.name),
        doubleDamageFrom: data.damage_relations.double_damage_from.map((i) => i.name),
      });
      setPokemonQueue(queueEntries);
      setTypePokemons(initialBatch);
      setHasMoreResults(initialBatch.length < queueEntries.length);
    } catch (fetchError) {
      setTypeInfo(null);
      clearListResults();
      setError(fetchError.message || 'Ocorreu um erro ao buscar os dados.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPokemonByGeneration = async (generationInput) => {
    const query = resolveGenerationQuery(generationInput);
    if (!query) {
      setError('Digite uma geração válida (1 a 9).');
      setTypeInfo(null);
      setTypePokemons([]);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setPokemon(null);
      setTypeInfo(null);
      clearListResults();

      const response = await fetch(`https://pokeapi.co/api/v2/generation/${query}`);
      if (!response.ok) throw new Error('Geração não encontrada. Use valores entre 1 e 9.');

      const data = await response.json();
      const queueEntries = data.pokemon_species
        .map((s) => ({ name: s.name, orderId: extractIdFromUrl(s.url) }))
        .sort((a, b) => a.orderId - b.orderId);

      const initialBatch = await fetchPokemonBatch(queueEntries, 0);
      setTypeInfo({ mode: 'generation', title: `Geração ${data.id}`, totalCount: queueEntries.length, doubleDamageTo: [], doubleDamageFrom: [] });
      setPokemonQueue(queueEntries);
      setTypePokemons(initialBatch);
      setHasMoreResults(initialBatch.length < queueEntries.length);
    } catch (fetchError) {
      setTypeInfo(null);
      clearListResults();
      setError(fetchError.message || 'Ocorreu um erro ao buscar os dados da geração.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPokemonById = async (idInput) => {
    const query = String(idInput).trim();
    const id = Number(query);
    if (!query || !Number.isInteger(id) || id < 1) {
      setError('Digite um ID válido maior que 0.');
      setPokemon(null);
      return;
    }
    setTypeInfo(null);
    clearListResults();
    await fetchPokemon(String(id));
  };

  useEffect(() => {
    fetchPokemon('pikachu');
  }, []);

  const handleSearch = () => {
    Keyboard.dismiss();
    if (searchMode === 'type') return fetchPokemonByType(pokemonType);
    if (searchMode === 'generation') return fetchPokemonByGeneration(pokemonGeneration);
    if (searchMode === 'id') return fetchPokemonById(pokemonIdQuery);
    setTypeInfo(null);
    clearListResults();
    fetchPokemon(pokemonName);
  };

  const handleEvolutionPress = (name) => {
    setSearchMode('name');
    setPokemonName(name);
    setTypeInfo(null);
    clearListResults();
    fetchPokemon(name);
  };

  const handleLoadMore = async () => {
    if (loading || loadingMore || !hasMoreResults || pokemonQueue.length === 0) return;
    try {
      setLoadingMore(true);
      const currentCount = typePokemons.length;
      const nextBatch = await fetchPokemonBatch(pokemonQueue, currentCount);
      setTypePokemons((prev) => [...prev, ...nextBatch]);
      setHasMoreResults(currentCount + nextBatch.length < pokemonQueue.length);
    } catch (loadError) {
      setError(loadError.message || 'Não foi possível carregar mais Pokémon.');
    } finally {
      setLoadingMore(false);
    }
  };

  const finalizeVoiceSearch = async (spokenText) => {
    const finalQuery = spokenText.trim();
    if (!finalQuery) {
      setVoiceStatus('error');
      setVoiceError('Não entendi a fala. Tente novamente.');
      return;
    }

    setActiveScreen('search');
    setSearchMode('name');
    setPokemonName(finalQuery);
    setVoiceTranscript(finalQuery);
    setVoiceError('');
    setVoiceStatus('processing');
    addVoiceHistoryItem(finalQuery);

    const success = await fetchPokemon(finalQuery);
    setVoiceStatus(success ? 'idle' : 'error');
    if (!success) {
      setVoiceError('Não encontrei esse Pokémon.');
    }
  };

  const startVoiceSearch = async () => {
    if (!voiceRecognitionAvailable) {
      setVoiceStatus('error');
      setVoiceError('Reconhecimento de voz indisponível neste app. Use um dev build nativo no Android/iOS.');
      return;
    }

    try {
      if (voiceRetryTimerRef.current) {
        clearTimeout(voiceRetryTimerRef.current);
        voiceRetryTimerRef.current = null;
      }

      setVoiceError('');
      setVoiceTranscript('');
      setActiveScreen('search');
      setSearchMode('name');

      const recognitionAvailable = await ExpoSpeechRecognitionModule.isRecognitionAvailable();
      if (!recognitionAvailable) {
        setVoiceStatus('error');
        setVoiceError('Reconhecimento de voz indisponível neste dispositivo.');
        return;
      }

      const permissionResult = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permissionResult.granted) {
        setVoiceStatus('error');
        setVoiceError('Permissão de microfone negada.');
        return;
      }

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setVoiceStatus('listening');
      setVoiceVolume(0);

      ExpoSpeechRecognitionModule.start({
        lang: 'pt-BR',
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
        contextualStrings: ['pikachu', 'bulbasaur', 'charmander', 'squirtle', 'eevee', 'charizard', 'mewtwo'],
      });
    } catch {
      setVoiceStatus('error');
      setVoiceError('Não foi possível iniciar a gravação.');
    }
  };

  const stopVoiceSearch = async () => {
    if (!voiceRecognitionAvailable) return;

    try {
      await ExpoSpeechRecognitionModule.stop();
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch {
      setVoiceStatus('error');
      setVoiceError('Não foi possível parar a gravação.');
    }
  };

  const cancelVoiceSearch = async () => {
    if (!voiceRecognitionAvailable) {
      setVoiceStatus('idle');
      setVoiceError('');
      setVoiceTranscript('');
      return;
    }

    try {
      if (voiceRetryTimerRef.current) {
        clearTimeout(voiceRetryTimerRef.current);
        voiceRetryTimerRef.current = null;
      }

      setVoiceStatus('idle');
      setVoiceError('');
      setVoiceTranscript('');
      await ExpoSpeechRecognitionModule.abort();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    } catch {
      setVoiceStatus('error');
      setVoiceError('Não foi possível cancelar a gravação.');
    }
  };

  const handleVoiceToggle = async () => {
    if (voiceStatus === 'listening') {
      await stopVoiceSearch();
      return;
    }

    if (voiceStatus === 'processing') return;
    await startVoiceSearch();
  };

  const handleVoiceRetry = async () => {
    if (voiceStatus === 'processing') return;
    await startVoiceSearch();
  };

  useSpeechRecognitionEvent('start', () => {
    setVoiceStatus('listening');
    setVoiceError('');
    setVoiceTranscript('');
  });

  useSpeechRecognitionEvent('end', () => {
    setVoiceStatus((currentStatus) => (currentStatus === 'processing' ? 'processing' : 'idle'));
  });

  useSpeechRecognitionEvent('volumechange', (event) => {
    const level = Number(event?.value ?? 0);
    setVoiceVolume(Number.isFinite(level) ? level : 0);
  });

  useSpeechRecognitionEvent('result', (event) => {
    const result = event?.results?.[0];
    const transcript = result?.transcript?.trim() || '';
    if (!transcript) return;

    setVoiceTranscript(transcript);

    const isFinal = Boolean(event?.isFinal ?? result?.isFinal);
    if (isFinal) {
      void finalizeVoiceSearch(transcript);
    }
  });

  useSpeechRecognitionEvent('nomatch', () => {
    setVoiceStatus('error');
    setVoiceError('Não consegui entender o que foi falado.');
  });

  useSpeechRecognitionEvent('error', (event) => {
    const code = event?.error || 'unknown';

    if (code === 'aborted') {
      setVoiceStatus('idle');
      setVoiceError('');
      return;
    }

    setVoiceStatus('error');
    setVoiceError(getVoiceErrorMessage(code));

    if ((code === 'busy' || code === 'network') && !voiceRetryTimerRef.current) {
      voiceRetryTimerRef.current = setTimeout(() => {
        voiceRetryTimerRef.current = null;
        void startVoiceSearch();
      }, 700);
    }
  });
const renderPokemonCard = (pokemonData) => {
  const themeColor = getTypeColor(pokemonData.primaryType);
  const cardBg = hexToRgba(themeColor, themeMode === 'dark' ? 0.18 : 0.12);
  const infoItemBg = hexToRgba(themeColor, themeMode === 'dark' ? 0.12 : 0.08);
  const pokemonImage = getPokemonImage(pokemonData);
  const favorite = isFavorite(pokemonData.id);

  return (
    <View
      key={pokemonData.id}
      style={[
        styles.resultCard,
        { backgroundColor: cardBg, borderTopWidth: 4, borderTopColor: themeColor },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.pokemonTitleBlock}>
          <Text
            style={[styles.pokemonName, { color: theme.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {pokemonData.name}
          </Text>
          <Text style={[styles.pokemonId, { color: theme.text }]}>
            #{String(pokemonData.id).padStart(3, '0')}
          </Text>
        </View>
        {pokemonImage ? <Image source={{ uri: pokemonImage }} style={styles.pokemonImage} /> : null}
      </View>

      <View style={styles.typeAndAudioRow}>
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

        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={[styles.favoriteButton, favorite ? styles.favoriteButtonActive : null]}
            onPress={() => toggleFavorite(pokemonData)}
            activeOpacity={0.85}
          >
            <Text style={[styles.favoriteButtonText, favorite && styles.favoriteButtonTextActive]}>
              {favorite ? '♥' : '♡'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.audioButton}
            onPress={() => playPokemonCry(pokemonData)}
            activeOpacity={0.85}
          >
            {audioLoadingId === pokemonData.id ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <AudioPlayIcon color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {pokemonData.evolutions?.length > 0 ? (
        <View style={[styles.evolutionSection, { borderColor: theme.border }]}>
          <Text style={[styles.infoLabel, { color: theme.mutedText }]}>Cadeia evolutiva</Text>
          <View style={styles.evolutionRow}>
            {pokemonData.evolutions.map((evolution, index) => (
              <View key={`${pokemonData.id}-${evolution.name}`} style={styles.evolutionStepWrap}>
                <TouchableOpacity
                  style={[
                    styles.evolutionStep,
                    { backgroundColor: theme.infoBg, borderColor: theme.border },
                  ]}
                  onPress={() => handleEvolutionPress(evolution.name)}
                  activeOpacity={0.85}
                >
                  {evolution.image ? (
                    <Image source={{ uri: evolution.image }} style={styles.evolutionImage} />
                  ) : (
                    <View style={styles.evolutionImageFallback} />
                  )}
                  <Text
                    style={[styles.evolutionName, { color: theme.text }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    {evolution.name}
                  </Text>
                </TouchableOpacity>

                {index < pokemonData.evolutions.length - 1 ? (
                  <Text style={[styles.evolutionArrow, { color: theme.mutedText }]}>→</Text>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <RadarChart stats={pokemonData.stats} color={themeColor} theme={theme} />

      <View style={styles.infoGrid}>
        <View style={[styles.infoItem, { backgroundColor: infoItemBg, borderColor: theme.border }]}>
          <Text style={[styles.infoLabel, { color: theme.mutedText }]}>Altura</Text>
          <Text style={[styles.infoValue, { color: theme.text }]}>{pokemonData.height} m</Text>
        </View>
        <View style={[styles.infoItem, { backgroundColor: infoItemBg, borderColor: theme.border }]}>
          <Text style={[styles.infoLabel, { color: theme.mutedText }]}>Peso</Text>
          <Text style={[styles.infoValue, { color: theme.text }]}>{pokemonData.weight} kg</Text>
        </View>
        <View style={[styles.infoItem, { backgroundColor: infoItemBg, borderColor: theme.border }]}>
          <Text style={[styles.infoLabel, { color: theme.mutedText }]}>Habilidades</Text>
          <Text style={[styles.infoValue, { color: theme.text }]}>{pokemonData.abilities.join(', ')}</Text>
        </View>
      </View>
    </View>
  );
};

const renderScreenSwitch = () => (
  <View style={styles.screenSwitchRow}>
    <TouchableOpacity
      style={[styles.screenSwitchButton, activeScreen === 'search' && styles.screenSwitchButtonActive]}
      onPress={() => setActiveScreen('search')}
      activeOpacity={0.85}
    >
      <Text
        style={[
          styles.screenSwitchText,
          { color: theme.inactiveText },
          activeScreen === 'search' && styles.screenSwitchTextActive,
        ]}
      >
        Busca
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.screenSwitchButton, activeScreen === 'favorites' && styles.screenSwitchButtonActive]}
      onPress={() => setActiveScreen('favorites')}
      activeOpacity={0.85}
    >
      <Text
        style={[
          styles.screenSwitchText,
          { color: theme.inactiveText },
          activeScreen === 'favorites' && styles.screenSwitchTextActive,
        ]}
      >
        Favoritos ({favorites.length})
      </Text>
    </TouchableOpacity>
  </View>
);

const renderSearchScreen = () => (
  <FlatList
    style={[styles.list, { backgroundColor: theme.screen }]}
    contentContainerStyle={[styles.container, { backgroundColor: theme.screen }]}
    data={typeInfo && !loading && !error ? typePokemons : []}
    keyExtractor={(item) => String(item.id)}
    renderItem={({ item }) => renderPokemonCard(item)}
    onEndReached={handleLoadMore}
    onEndReachedThreshold={0.35}
    keyboardShouldPersistTaps="handled"
    ListHeaderComponent={
      <>
        <View style={styles.titleRow}>
          <View style={styles.pokeballFrame}>
            <Image source={require('./assets/pokebola.png')} style={styles.pokeballImage} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Pokédex Mobile</Text>
        </View>

        <View style={styles.themeRow}>
          <TouchableOpacity
            style={[styles.themeButton, themeMode === 'dark' && styles.themeButtonActive]}
            onPress={() => setThemeMode('dark')}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.themeButtonText,
                { color: theme.inactiveText },
                themeMode === 'dark' && styles.themeButtonTextActive,
              ]}
            >
              Escuro
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.themeButton, themeMode === 'light' && styles.themeButtonActive]}
            onPress={() => setThemeMode('light')}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.themeButtonText,
                { color: theme.inactiveText },
                themeMode === 'light' && styles.themeButtonTextActive,
              ]}
            >
              Claro
            </Text>
          </TouchableOpacity>
        </View>

        {renderScreenSwitch()}

        <Text style={[styles.subtitle, { color: theme.mutedText }]}>
          Busque por nome, tipo, geração ou ID do Pokémon.
        </Text>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow },
          ]}
        >
          <View style={styles.modeRow}>
            {['name', 'type', 'generation', 'id'].map((mode) => {
              const labels = {
                name: 'Por nome',
                type: 'Por tipo',
                generation: 'Por geração',
                id: 'Por ID',
              };
              return (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.modeButton,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    searchMode === mode && styles.modeButtonActive,
                  ]}
                  onPress={() => setSearchMode(mode)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.modeButtonText,
                      { color: theme.inactiveText },
                      searchMode === mode && styles.modeButtonTextActive,
                    ]}
                  >
                    {labels[mode]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.variantRow}>
            {[
              { key: 'official', label: 'Oficial' },
              { key: 'classic', label: 'Pixel art' },
              { key: 'shiny', label: 'Shiny' },
            ].map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.variantButton,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  imageVariant === key && styles.variantButtonActive,
                ]}
                onPress={() => setImageVariant(key)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.variantButtonText,
                    { color: theme.inactiveText },
                    imageVariant === key && styles.variantButtonTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: theme.text }]}>
            {searchMode === 'name'
              ? 'Nome do Pokémon'
              : searchMode === 'type'
                ? 'Tipo do Pokémon'
                : searchMode === 'generation'
                  ? 'Geração do Pokémon'
                  : 'ID do Pokémon'}
          </Text>

          {searchMode === 'name' && (
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border },
              ]}
              placeholder="Ex.: pikachu"
              placeholderTextColor={theme.mutedText}
              value={pokemonName}
              onChangeText={setPokemonName}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
          )}
          {searchMode === 'type' && (
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border },
              ]}
              placeholder="Ex.: electric"
              placeholderTextColor={theme.mutedText}
              value={pokemonType}
              onChangeText={setPokemonType}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
          )}
          {searchMode === 'generation' && (
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border },
              ]}
              placeholder="Ex.: 1, kanto, johto"
              placeholderTextColor={theme.mutedText}
              value={pokemonGeneration}
              onChangeText={setPokemonGeneration}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
          )}
          {searchMode === 'id' && (
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border },
              ]}
              placeholder="Ex.: 25"
              placeholderTextColor={theme.mutedText}
              value={pokemonIdQuery}
              onChangeText={setPokemonIdQuery}
              keyboardType="number-pad"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
          )}

          <View style={[styles.voiceCard, { backgroundColor: theme.infoBg, borderColor: theme.border }]}>
            <View style={styles.voiceCardHeader}>
              <Text style={[styles.voiceTitle, { color: theme.text }]}>Busca por voz</Text>
              <View
                style={[
                  styles.voiceStatusPill,
                  voiceStatus === 'listening' && styles.voiceStatusListening,
                  voiceStatus === 'processing' && styles.voiceStatusProcessing,
                  voiceStatus === 'error' && styles.voiceStatusError,
                ]}
              >
                <Text
                  style={[
                    styles.voiceStatusText,
                    voiceStatus === 'listening' && styles.voiceStatusTextActive,
                    voiceStatus === 'processing' && styles.voiceStatusTextActive,
                    voiceStatus === 'error' && styles.voiceStatusTextError,
                  ]}
                >
                  {voiceStatus === 'listening'
                    ? 'Ouvindo'
                    : voiceStatus === 'processing'
                      ? 'Processando'
                      : voiceStatus === 'error'
                        ? 'Erro'
                        : 'Pronto'}
                </Text>
              </View>
            </View>

            <Text style={[styles.voiceHint, { color: theme.mutedText }]}>
              {voiceStatus === 'listening'
                ? 'Fale o nome do Pokémon agora.'
                : voiceStatus === 'processing'
                  ? 'Estou convertendo sua fala em busca.'
                  : voiceStatus === 'error'
                    ? voiceError || 'Houve um problema no reconhecimento.'
                    : Platform.OS === 'web'
                      ? 'No navegador, o reconhecimento usa a API de voz do próprio browser.'
                      : voiceRecognitionAvailable
                        ? 'Toque no microfone e fale algo como “Pikachu”.'
                        : 'Este app precisa de um dev build nativo para usar voz no Android/iOS.'}
            </Text>

            <View style={styles.voiceControlsRow}>
              <Animated.View
                style={[
                  styles.voiceMicWrap,
                  voiceStatus === 'listening' && {
                    transform: [
                      {
                        scale: voicePulse.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.12],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.voiceMicButton,
                    voiceStatus === 'listening' && styles.voiceMicButtonListening,
                    voiceStatus === 'processing' && styles.voiceMicButtonProcessing,
                    voiceStatus === 'error' && styles.voiceMicButtonError,
                    !voiceRecognitionAvailable && styles.voiceMicButtonDisabled,
                  ]}
                  onPress={handleVoiceToggle}
                  activeOpacity={0.88}
                  disabled={!voiceRecognitionAvailable}
                >
                  <MicIcon color={voiceStatus === 'idle' ? '#FFFFFF' : '#111827'} />
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity
                style={[
                  styles.voiceCancelButton,
                  voiceStatus !== 'listening' && styles.voiceCancelButtonDisabled,
                  !voiceRecognitionAvailable && styles.voiceCancelButtonDisabled,
                ]}
                onPress={cancelVoiceSearch}
                activeOpacity={0.85}
                disabled={voiceStatus !== 'listening' || !voiceRecognitionAvailable}
              >
                <Text style={[styles.voiceCancelText, voiceStatus !== 'listening' && styles.voiceCancelTextDisabled]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.voiceMetaRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.voiceTranscriptLabel, { color: theme.mutedText }]}>Reconhecido</Text>
              <Text style={[styles.voiceTranscriptValue, { color: theme.text }]} numberOfLines={1}>
                {voiceTranscript || '—'}
              </Text>
            </View>

            {voiceStatus === 'error' && voiceError ? (
              <View style={[styles.voiceErrorBox, { backgroundColor: theme.stateBg, borderColor: 'rgba(248,113,113,0.26)' }]}>
                <Text style={styles.voiceErrorText}>{voiceError}</Text>
                <TouchableOpacity style={styles.voiceRetryButton} onPress={handleVoiceRetry} activeOpacity={0.85}>
                  <Text style={styles.voiceRetryButtonText}>Tentar de novo</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {voiceHistory.length > 0 ? (
              <View style={styles.voiceHistorySection}>
                <Text style={[styles.voiceHistoryTitle, { color: theme.mutedText }]}>Últimas pesquisas por voz</Text>
                <View style={styles.voiceHistoryRow}>
                  {voiceHistory.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[styles.voiceHistoryChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
                      onPress={() => {
                        setPokemonName(item);
                        setSearchMode('name');
                        setActiveScreen('search');
                        void fetchPokemon(item);
                      }}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.voiceHistoryText, { color: theme.text }]}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSearch} activeOpacity={0.85}>
            <Text style={styles.buttonText}>
              {searchMode === 'name'
                ? 'Buscar dados'
                : searchMode === 'type'
                  ? 'Buscar por tipo'
                  : searchMode === 'generation'
                    ? 'Buscar por geração'
                    : 'Buscar por ID'}
            </Text>
          </TouchableOpacity>

          {loading ? (
            <View style={[styles.stateBox, { backgroundColor: theme.stateBg, borderColor: theme.border }]}>
              <LoadingAnimation theme={theme} message="Carregando dados..." />
            </View>
          ) : null}

          {error ? (
            <View
              style={[
                styles.stateBox,
                styles.errorBox,
                { backgroundColor: theme.stateBg, borderColor: 'rgba(248, 113, 113, 0.35)' },
              ]}
            >
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {pokemon && !loading && !error ? renderPokemonCard(pokemon) : null}

          {typeInfo && !loading && !error ? (
            <View
              style={[
                styles.resultCard,
                { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow },
              ]}
            >
              <Text style={[styles.pokemonName, { color: theme.text }]}>{typeInfo.title}</Text>
              <Text style={[styles.typeSummary, { color: theme.mutedText }]}>
                Pokémon encontrados: {typePokemons.length}
              </Text>

              <View style={styles.infoGrid}>
                {typeInfo.doubleDamageTo.length > 0 && (
                  <View style={[styles.infoItem, { backgroundColor: theme.infoBg, borderColor: theme.border }]}>
                    <Text style={[styles.infoLabel, { color: theme.mutedText }]}>Dano forte contra</Text>
                    <View style={styles.typeChipsRow}>
                      {typeInfo.doubleDamageTo.map((typeName) => {
                        const chipColor = getTypeColor(typeName);
                        return (
                          <View key={typeName} style={[styles.typeChip, { backgroundColor: chipColor }]}>
                            <Text style={[styles.typeChipText, { color: getReadableTextColor(chipColor) }]}>
                              {typeName}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {typeInfo.doubleDamageFrom.length > 0 && (
                  <View style={[styles.infoItem, { backgroundColor: theme.infoBg, borderColor: theme.border }]}>
                    <Text style={[styles.infoLabel, { color: theme.mutedText }]}>Dano forte recebido de</Text>
                    <View style={styles.typeChipsRow}>
                      {typeInfo.doubleDamageFrom.map((typeName) => {
                        const chipColor = getTypeColor(typeName);
                        return (
                          <View key={typeName} style={[styles.typeChip, { backgroundColor: chipColor }]}>
                            <Text style={[styles.typeChipText, { color: getReadableTextColor(chipColor) }]}>
                              {typeName}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            </View>
          ) : null}
        </View>
      </>
    }
    ListFooterComponent={
      hasMoreResults && !loading ? (
        <View style={styles.footerWrap}>
          {loadingMore ? <LoadingAnimation compact theme={theme} message="Carregando mais Pokémon..." /> : null}
        </View>
      ) : null
    }
  />
);

const renderFavoritesScreen = () => {
  const favoritePokemons = [...favorites].sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));

  return (
    <FlatList
      style={[styles.list, { backgroundColor: theme.screen }]}
      contentContainerStyle={[
        styles.container,
        {
          backgroundColor: theme.screen,
          justifyContent: favoritePokemons.length > 0 ? 'flex-start' : 'center',
        },
      ]}
      data={favoritePokemons}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => renderPokemonCard(item)}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <>
          <View style={styles.titleRow}>
            <View style={styles.pokeballFrame}>
              <Image source={require('./assets/pokebola.png')} style={styles.pokeballImage} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Pokédex Mobile</Text>
          </View>

          <View style={styles.themeRow}>
            <TouchableOpacity
              style={[styles.themeButton, themeMode === 'dark' && styles.themeButtonActive]}
              onPress={() => setThemeMode('dark')}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.themeButtonText,
                  { color: theme.inactiveText },
                  themeMode === 'dark' && styles.themeButtonTextActive,
                ]}
              >
                Escuro
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.themeButton, themeMode === 'light' && styles.themeButtonActive]}
              onPress={() => setThemeMode('light')}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.themeButtonText,
                  { color: theme.inactiveText },
                  themeMode === 'light' && styles.themeButtonTextActive,
                ]}
              >
                Claro
              </Text>
            </TouchableOpacity>
          </View>

          {renderScreenSwitch()}

          <Text style={[styles.subtitle, { color: theme.mutedText }]}>Seus Pokémons favoritos salvos localmente.</Text>
        </>
      }
      ListEmptyComponent={
        <View style={[styles.emptyStateCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.emptyStateTitle, { color: theme.text }]}>Nenhum favorito ainda</Text>
          <Text style={[styles.emptyStateText, { color: theme.mutedText }]}>
            Toque no coração de um Pokémon na busca para adicioná-lo aqui.
          </Text>
        </View>
      }
    />
  );
};

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      {activeScreen === 'favorites' ? renderFavoritesScreen() : renderSearchScreen()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0B1020' },
  list: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#0B1020',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  title: { color: '#F8FAFC', fontSize: 32, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 },
  themeRow: { flexDirection: 'row', gap: 10, marginBottom: 10, alignSelf: 'center' },
  screenSwitchRow: { flexDirection: 'row', gap: 10, marginBottom: 14, alignSelf: 'center', flexWrap: 'wrap' },
  screenSwitchButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  screenSwitchButtonActive: { backgroundColor: '#F7C948', borderColor: '#F7C948' },
  screenSwitchText: { fontSize: 13, fontWeight: '800' },
  screenSwitchTextActive: { color: '#111827' },
  themeButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  themeButtonActive: { backgroundColor: '#F7C948', borderColor: '#F7C948' },
  themeButtonText: { fontSize: 13, fontWeight: '800' },
  themeButtonTextActive: { color: '#111827' },
  pokeballFrame: {},
  pokeballImage: { width: 50, height: 50, resizeMode: 'contain', backgroundColor: 'transparent' },
  subtitle: { color: '#B8C2D1', fontSize: 15, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
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
  modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  variantRow: { flexDirection: 'row', gap: 10, marginBottom: 14, flexWrap: 'wrap' },
  variantButton: {
    flexGrow: 1,
    minWidth: 90,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#0B1020',
  },
  variantButtonActive: { backgroundColor: '#F7C948', borderColor: '#F7C948' },
  variantButtonText: { color: '#D7DEEA', fontSize: 13, fontWeight: '700' },
  variantButtonTextActive: { color: '#111827' },
  modeButton: {
    flexGrow: 1,
    minWidth: 120,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#0B1020',
  },
  modeButtonActive: { backgroundColor: '#F7C948', borderColor: '#F7C948' },
  modeButtonText: { color: '#D7DEEA', fontSize: 14, fontWeight: '700' },
  modeButtonTextActive: { color: '#111827' },
  label: { color: '#D7DEEA', fontSize: 14, marginBottom: 10, fontWeight: '600' },
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
  voiceCard: {
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  voiceCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  voiceTitle: { fontSize: 15, fontWeight: '800' },
  voiceStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.18)',
  },
  voiceStatusListening: { backgroundColor: 'rgba(34,197,94,0.22)' },
  voiceStatusProcessing: { backgroundColor: 'rgba(245,158,11,0.22)' },
  voiceStatusError: { backgroundColor: 'rgba(248,113,113,0.22)' },
  voiceStatusText: { fontSize: 11, fontWeight: '800', color: '#D7DEEA', textTransform: 'uppercase', letterSpacing: 0.6 },
  voiceStatusTextActive: { color: '#111827' },
  voiceStatusTextError: { color: '#FCA5A5' },
  voiceHint: { fontSize: 13, lineHeight: 18 },
  voiceControlsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  voiceMicWrap: { width: 68, height: 68, alignItems: 'center', justifyContent: 'center' },
  voiceMicButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  voiceMicButtonListening: { backgroundColor: '#22C55E' },
  voiceMicButtonProcessing: { backgroundColor: '#F7C948' },
  voiceMicButtonError: { backgroundColor: '#F87171' },
  voiceMicButtonDisabled: { backgroundColor: '#475569', opacity: 0.55 },
  voiceCancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(148,163,184,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
  },
  voiceCancelButtonDisabled: { opacity: 0.45 },
  voiceCancelText: { color: '#F8FAFC', fontSize: 13, fontWeight: '800' },
  voiceCancelTextDisabled: { color: '#94A3B8' },
  voiceMetaRow: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(15,23,42,0.24)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 6,
  },
  voiceTranscriptLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: '800' },
  voiceTranscriptValue: { fontSize: 15, fontWeight: '700' },
  voiceErrorBox: {
    gap: 10,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.26)',
    backgroundColor: 'rgba(127,29,29,0.16)',
  },
  voiceErrorText: { color: '#FCA5A5', fontSize: 13, lineHeight: 19 },
  voiceRetryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#F7C948',
  },
  voiceRetryButtonText: { color: '#111827', fontSize: 12, fontWeight: '900' },
  voiceHistorySection: { gap: 8 },
  voiceHistoryTitle: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: '800' },
  voiceHistoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  voiceHistoryChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  voiceHistoryText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  button: {
    marginTop: 14,
    backgroundColor: '#F7C948',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#111827', fontSize: 16, fontWeight: '800' },
  stateBox: {
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#0B1020',
    alignItems: 'center',
    gap: 10,
  },
  stateText: { color: '#D7DEEA', fontSize: 15 },
  errorBox: { borderWidth: 1, borderColor: 'rgba(248, 113, 113, 0.35)' },
  errorText: { color: '#FCA5A5', textAlign: 'center', fontSize: 15 },
  resultCard: {
    marginTop: 18,
    backgroundColor: '#0B1020',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  pokemonTitleBlock: { flex: 1, paddingRight: 6 },
  pokemonName: { color: '#F8FAFC', fontSize: 28, fontWeight: '900', textTransform: 'capitalize' },
  pokemonId: { color: '#F7C948', fontSize: 14, marginTop: 4, fontWeight: '700' },
  pokemonImage: { width: 112, height: 112 },
  radarWrap: { marginTop: 16, alignItems: 'center', justifyContent: 'center' },
  typeChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  typeAndAudioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  cardActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  favoriteButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  favoriteButtonActive: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  favoriteButtonText: { fontSize: 22, color: '#FFFFFF', fontWeight: '900', lineHeight: 22 },
  favoriteButtonTextActive: { color: '#111827' },
  typeChip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, alignSelf: 'flex-start' },
  typeChipText: { fontSize: 12, fontWeight: '800', textTransform: 'capitalize', letterSpacing: 0.4 },
  infoGrid: { marginTop: 20, gap: 12 },
  infoItem: { backgroundColor: '#121A2C', borderRadius: 16, padding: 14 },
  infoLabel: {
    color: '#8EA0BA',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    fontWeight: '700',
  },
  infoValue: { color: '#F8FAFC', fontSize: 15, fontWeight: '600' },
  audioButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
    alignSelf: 'flex-end',
    marginRight: 4,
    marginTop: 3,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  evolutionSection: { marginTop: 16, borderWidth: 1, borderRadius: 14, padding: 12 },
  evolutionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  evolutionStepWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  evolutionStep: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  evolutionImage: { width: 42, height: 42, resizeMode: 'contain', marginBottom: 4 },
  evolutionImageFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(148,163,184,0.35)',
    marginBottom: 4,
  },
  evolutionName: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
    textAlign: 'center',
    width: '100%',
  },
  evolutionArrow: { fontSize: 18, fontWeight: '800' },
  typeSummary: { color: '#D7DEEA', marginTop: 6, fontSize: 14, marginBottom: 6 },
  loadingWrap: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 4 },
  loadingWrapCompact: { paddingVertical: 0 },
  loadingAnimation: { width: 132, height: 132 },
  loadingAnimationCompact: { width: 72, height: 72 },
  footerWrap: { paddingVertical: 18, alignItems: 'center' },
  emptyStateCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
  },
  emptyStateTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  emptyStateText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
