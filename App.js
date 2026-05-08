import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Audio } from 'expo-av';
import Svg, { Circle, G, Line, Polygon, Text as SvgText } from 'react-native-svg';

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
    const normalized = normalizeText(value).replace(/^geracao\s*/i, '').replace(/^generation\s*/i, '');

    const GENERATION_ALIASES = {
      '1': '1',
      i: '1',
      kanto: '1',
      '2': '2',
      ii: '2',
      johto: '2',
      '3': '3',
      iii: '3',
      hoenn: '3',
      '4': '4',
      iv: '4',
      sinnoh: '4',
      '5': '5',
      v: '5',
      unova: '5',
      '6': '6',
      vi: '6',
      kalos: '6',
      '7': '7',
      vii: '7',
      alola: '7',
      '8': '8',
      viii: '8',
      galar: '8',
      '9': '9',
      ix: '9',
      paldea: '9',
    };

    return GENERATION_ALIASES[normalized] || normalized;
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

  const hexToRgba = (hexColor, alpha) => {
    const color = hexColor.replace('#', '');
    const red = parseInt(color.slice(0, 2), 16);
    const green = parseInt(color.slice(2, 4), 16);
    const blue = parseInt(color.slice(4, 6), 16);

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
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

  const RadarChart = ({ stats, color, theme }) => {
    const size = 240;
    const center = size / 2;
    const radius = 78;
    const values = STAT_KEYS.map((statKey) => stats?.[statKey] ?? 0);
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
            <Polygon
              key={ring}
              points={ringPoints(ring)}
              fill="none"
              stroke={theme.chartGrid}
              strokeWidth="1"
            />
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
                <Line
                  x1={center}
                  y1={center}
                  x2={lineX}
                  y2={lineY}
                  stroke={theme.chartAxis}
                  strokeWidth="1"
                />
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
            points={STAT_KEYS.map((statKey, index) => pointAt(stats?.[statKey] ?? 0, index)).join(' ')}
            fill={hexToRgba(color, 0.42)}
            stroke={color}
            strokeWidth="3"
          />

          {STAT_KEYS.map((statKey, index) => {
            const point = pointAt(stats?.[statKey] ?? 0, index).split(',');
            return (
              <Circle
                key={statKey}
                cx={Number(point[0])}
                cy={Number(point[1])}
                r="4"
                fill="#FFFFFF"
                stroke={color}
                strokeWidth="2"
              />
            );
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
      if (!evolutionUrl) {
        return [];
      }

      const evolutionResponse = await fetch(evolutionUrl);
      if (!evolutionResponse.ok) {
        return [];
      }

      const evolutionData = await evolutionResponse.json();
      const evolutionNames = parseEvolutionNames(evolutionData.chain);

      const evolutionCards = await Promise.all(
        evolutionNames.map(async (name) => {
          const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);

          if (!pokemonResponse.ok) {
            return { id: name, name, image: null };
          }

          const pokemonData = await pokemonResponse.json();

          return {
            id: pokemonData.id,
            name: pokemonData.name,
            image:
              pokemonData.sprites.other?.['official-artwork']?.front_default ||
              pokemonData.sprites.front_default ||
              null,
          };
        }),
      );

      return evolutionCards;
    } catch (error) {
      return [];
    }
  };

  const getPokemonImage = (pokemonData) => pokemonData.images?.[imageVariant] || pokemonData.image || null;

  const getPokemonCry = (pokemonData) => pokemonData.cry || null;

  const extractIdFromUrl = (url) => {
    if (!url) {
      return Number.MAX_SAFE_INTEGER;
    }

    const match = url.match(/\/(\d+)\/?$/);
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
  };

  const clearListResults = () => {
    setTypePokemons([]);
    setPokemonQueue([]);
    setHasMoreResults(false);
    setLoadingMore(false);
  };

  const fetchPokemonBatch = async (entries, startIndex) => {
    const chunk = entries.slice(startIndex, startIndex + POKEMON_BATCH_SIZE);

    const detailedPokemons = await Promise.all(
      chunk.map(async (entry) => {
        const endpoint = entry.url || `https://pokeapi.co/api/v2/pokemon/${entry.name}`;
        const pokemonResponse = await fetch(endpoint);

        if (!pokemonResponse.ok) {
          return null;
        }

        const pokemonData = await pokemonResponse.json();
        return buildPokemonCard(pokemonData);
      }),
    );

    return detailedPokemons.filter(Boolean);
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

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true },
      );

      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          await sound.unloadAsync();
          if (soundRef.current === sound) {
            soundRef.current = null;
          }
        }
      });
    } catch (audioError) {
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
      clearListResults();
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);

      if (!response.ok) {
        throw new Error('Pokémon não encontrado. Verifique o nome e tente novamente.');
      }

      const data = await response.json();
      const evolutions = await fetchEvolutionChain(data.species?.url);
      const cardData = buildPokemonCard(data, evolutions);
      setPokemon(cardData);
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
      clearListResults();

      const response = await fetch(`https://pokeapi.co/api/v2/type/${query}`);

      if (!response.ok) {
        throw new Error('Tipo não encontrado. Use exemplos como fire, water ou electric.');
      }

      const data = await response.json();

      const queueEntries = data.pokemon
        .map((entry) => ({
          name: entry.pokemon.name,
          url: entry.pokemon.url,
          orderId: extractIdFromUrl(entry.pokemon.url),
        }))
        .sort((a, b) => a.orderId - b.orderId);

      const initialBatch = await fetchPokemonBatch(queueEntries, 0);

      setTypeInfo({
        mode: 'type',
        title: `${data.name} type`,
        totalCount: queueEntries.length,
        doubleDamageTo: data.damage_relations.double_damage_to.map((item) => item.name),
        doubleDamageFrom: data.damage_relations.double_damage_from.map((item) => item.name),
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

      if (!response.ok) {
        throw new Error('Geração não encontrada. Use valores entre 1 e 9.');
      }

      const data = await response.json();

      const queueEntries = data.pokemon_species
        .map((speciesEntry) => ({
          name: speciesEntry.name,
          orderId: extractIdFromUrl(speciesEntry.url),
        }))
        .sort((a, b) => a.orderId - b.orderId);

      const initialBatch = await fetchPokemonBatch(queueEntries, 0);

      setTypeInfo({
        mode: 'generation',
        title: `Geração ${data.id}`,
        totalCount: queueEntries.length,
        doubleDamageTo: [],
        doubleDamageFrom: [],
      });
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

    if (searchMode === 'type') {
      fetchPokemonByType(pokemonType);
      return;
    }

    if (searchMode === 'generation') {
      fetchPokemonByGeneration(pokemonGeneration);
      return;
    }

    if (searchMode === 'id') {
      fetchPokemonById(pokemonIdQuery);
      return;
    }

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
    if (loading || loadingMore || !hasMoreResults || pokemonQueue.length === 0) {
      return;
    }

    try {
      setLoadingMore(true);
      const nextBatch = await fetchPokemonBatch(pokemonQueue, typePokemons.length);
      setTypePokemons((previous) => [...previous, ...nextBatch]);
      setHasMoreResults(typePokemons.length + nextBatch.length < pokemonQueue.length);
    } catch (loadError) {
      setError(loadError.message || 'Não foi possível carregar mais Pokémon.');
    } finally {
      setLoadingMore(false);
    }
  };

  const renderPokemonCard = (pokemonData) => (
    (() => {
      const themeColor = getTypeColor(pokemonData.primaryType);
      const cardBackgroundColor = hexToRgba(themeColor, themeMode === 'dark' ? 0.18 : 0.12);
      const infoItemBackgroundColor = hexToRgba(themeColor, themeMode === 'dark' ? 0.12 : 0.08);
      const cardTextColor = theme.text;
      const pokemonImage = getPokemonImage(pokemonData);

      return (
    <View
      key={pokemonData.id}
      style={[
        styles.resultCard,
        {
          backgroundColor: cardBackgroundColor,
          borderTopWidth: 4,
          borderTopColor: themeColor,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.pokemonTitleBlock}>
          <Text
            style={[styles.pokemonName, { color: cardTextColor }]}
            numberOfLines={1}
            ellipsizeMode="tail"
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {pokemonData.name}
          </Text>
          <Text style={[styles.pokemonId, { color: cardTextColor }]}>#{String(pokemonData.id).padStart(3, '0')}</Text>
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

      {pokemonData.evolutions?.length > 0 ? (
        <View style={[styles.evolutionSection, { borderColor: theme.border }]}>
          <Text style={[styles.infoLabel, { color: theme.mutedText }]}>Cadeia evolutiva</Text>
          <View style={styles.evolutionRow}>
            {pokemonData.evolutions.map((evolution, index) => (
              <View key={`${pokemonData.id}-${evolution.name}`} style={styles.evolutionStepWrap}>
                <TouchableOpacity
                  style={[styles.evolutionStep, { backgroundColor: theme.infoBg, borderColor: theme.border }]}
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
        <View style={[styles.infoItem, { backgroundColor: infoItemBackgroundColor, borderColor: theme.border }]}> 
          <Text style={[styles.infoLabel, { color: theme.mutedText }]}>Altura</Text>
          <Text style={[styles.infoValue, { color: theme.text }]}>{pokemonData.height} m</Text>
        </View>

        <View style={[styles.infoItem, { backgroundColor: infoItemBackgroundColor, borderColor: theme.border }]}> 
          <Text style={[styles.infoLabel, { color: theme.mutedText }]}>Peso</Text>
          <Text style={[styles.infoValue, { color: theme.text }]}>{pokemonData.weight} kg</Text>
        </View>

        <View style={[styles.infoItem, { backgroundColor: infoItemBackgroundColor, borderColor: theme.border }]}> 
          <Text style={[styles.infoLabel, { color: theme.mutedText }]}>Habilidades</Text>
          <Text style={[styles.infoValue, { color: theme.text }]}>{pokemonData.abilities.join(', ')}</Text>
        </View>
      </View>
    </View>
      );
    })()
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.screen }]}>
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
            <Text style={[styles.themeButtonText, { color: theme.inactiveText }, themeMode === 'dark' && styles.themeButtonTextActive]}>
              Escuro
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.themeButton, themeMode === 'light' && styles.themeButtonActive]}
            onPress={() => setThemeMode('light')}
            activeOpacity={0.85}
          >
            <Text style={[styles.themeButtonText, { color: theme.inactiveText }, themeMode === 'light' && styles.themeButtonTextActive]}>
              Claro
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.subtitle, { color: theme.mutedText }]}>Busque por nome, tipo, geração ou ID do Pokémon.</Text>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }] }>
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                { backgroundColor: theme.surface, borderColor: theme.border },
                searchMode === 'name' && styles.modeButtonActive,
              ]}
              onPress={() => setSearchMode('name')}
              activeOpacity={0.85}
            >
              <Text style={[styles.modeButtonText, { color: theme.inactiveText }, searchMode === 'name' && styles.modeButtonTextActive]}>
                Por nome
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeButton,
                { backgroundColor: theme.surface, borderColor: theme.border },
                searchMode === 'type' && styles.modeButtonActive,
              ]}
              onPress={() => setSearchMode('type')}
              activeOpacity={0.85}
            >
              <Text style={[styles.modeButtonText, { color: theme.inactiveText }, searchMode === 'type' && styles.modeButtonTextActive]}>
                Por tipo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeButton,
                { backgroundColor: theme.surface, borderColor: theme.border },
                searchMode === 'generation' && styles.modeButtonActive,
              ]}
              onPress={() => setSearchMode('generation')}
              activeOpacity={0.85}
            >
              <Text style={[styles.modeButtonText, { color: theme.inactiveText }, searchMode === 'generation' && styles.modeButtonTextActive]}>
                Por geração
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeButton,
                { backgroundColor: theme.surface, borderColor: theme.border },
                searchMode === 'id' && styles.modeButtonActive,
              ]}
              onPress={() => setSearchMode('id')}
              activeOpacity={0.85}
            >
              <Text style={[styles.modeButtonText, { color: theme.inactiveText }, searchMode === 'id' && styles.modeButtonTextActive]}>
                Por ID
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.variantRow}>
            <TouchableOpacity
              style={[
                styles.variantButton,
                { backgroundColor: theme.surface, borderColor: theme.border },
                imageVariant === 'official' && styles.variantButtonActive,
              ]}
              onPress={() => setImageVariant('official')}
              activeOpacity={0.85}
            >
              <Text style={[styles.variantButtonText, { color: theme.inactiveText }, imageVariant === 'official' && styles.variantButtonTextActive]}>
                Oficial
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.variantButton,
                { backgroundColor: theme.surface, borderColor: theme.border },
                imageVariant === 'classic' && styles.variantButtonActive,
              ]}
              onPress={() => setImageVariant('classic')}
              activeOpacity={0.85}
            >
              <Text style={[styles.variantButtonText, { color: theme.inactiveText }, imageVariant === 'classic' && styles.variantButtonTextActive]}>
                Pixel art
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.variantButton,
                { backgroundColor: theme.surface, borderColor: theme.border },
                imageVariant === 'shiny' && styles.variantButtonActive,
              ]}
              onPress={() => setImageVariant('shiny')}
              activeOpacity={0.85}
            >
              <Text style={[styles.variantButtonText, { color: theme.inactiveText }, imageVariant === 'shiny' && styles.variantButtonTextActive]}>
                Shiny
              </Text>
            </TouchableOpacity>
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

          {searchMode === 'name' ? (
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              placeholder="Ex.: pikachu"
              placeholderTextColor={theme.mutedText}
              value={pokemonName}
              onChangeText={setPokemonName}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
          ) : null}

          {searchMode === 'type' ? (
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              placeholder="Ex.: electric"
              placeholderTextColor={theme.mutedText}
              value={pokemonType}
              onChangeText={setPokemonType}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
          ) : null}

          {searchMode === 'generation' ? (
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              placeholder="Ex.: 1, kanto, johto"
              placeholderTextColor={theme.mutedText}
              value={pokemonGeneration}
              onChangeText={setPokemonGeneration}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
          ) : null}

          {searchMode === 'id' ? (
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
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
          ) : null}

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
            <View style={[styles.stateBox, { backgroundColor: theme.stateBg, borderColor: theme.border }] }>
              <ActivityIndicator size="large" color="#F7C948" />
              <Text style={[styles.stateText, { color: theme.mutedText }]}>Carregando dados...</Text>
            </View>
          ) : null}

          {error ? (
            <View style={[styles.stateBox, styles.errorBox, { backgroundColor: theme.stateBg, borderColor: 'rgba(248, 113, 113, 0.35)' }]}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {pokemon && !loading && !error ? renderPokemonCard(pokemon) : null}

          {typeInfo && !loading && !error ? (
            <View style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
              <Text style={[styles.pokemonName, { color: theme.text }]}>{typeInfo.typeName} type</Text>
              <Text style={[styles.typeSummary, { color: theme.mutedText }]}>Pokémon encontrados: {typePokemons.length}</Text>

              <View style={styles.infoGrid}>
                <View style={[styles.infoItem, { backgroundColor: theme.infoBg, borderColor: theme.border }]}>
                  <Text style={[styles.infoLabel, { color: theme.mutedText }]}>Dano forte contra</Text>
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
                      <Text style={[styles.infoValue, { color: theme.text }]}>Nenhum</Text>
                    )}
                  </View>
                </View>

                <View style={[styles.infoItem, { backgroundColor: theme.infoBg, borderColor: theme.border }]}>
                  <Text style={[styles.infoLabel, { color: theme.mutedText }]}>Dano forte recebido de</Text>
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
                      <Text style={[styles.infoValue, { color: theme.text }]}>Nenhum</Text>
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
  themeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    alignSelf: 'center',
  },
  themeButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  themeButtonActive: {
    backgroundColor: '#F7C948',
    borderColor: '#F7C948',
  },
  themeButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
  themeButtonTextActive: {
    color: '#111827',
  },
  pokeballImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    backgroundColor: 'transparent',
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
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  variantRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
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
  variantButtonActive: {
    backgroundColor: '#F7C948',
    borderColor: '#F7C948',
  },
  variantButtonText: {
    color: '#D7DEEA',
    fontSize: 13,
    fontWeight: '700',
  },
  variantButtonTextActive: {
    color: '#111827',
  },
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
  pokemonTitleBlock: {
    flex: 1,
    paddingRight: 6,
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
  radarWrap: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  typeAndAudioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
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
  evolutionSection: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  evolutionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  evolutionStepWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  evolutionStep: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  evolutionImage: {
    width: 42,
    height: 42,
    resizeMode: 'contain',
    marginBottom: 4,
  },
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
  evolutionArrow: {
    fontSize: 18,
    fontWeight: '800',
  },
  audioButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  typeSummary: {
    color: '#D7DEEA',
    marginTop: 6,
    fontSize: 14,
    marginBottom: 6,
  },
});
