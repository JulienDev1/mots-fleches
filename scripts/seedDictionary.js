import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach((line) => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const rawWords = [
  // Mots 2 lettres
  { word: "OR", definition: "Métal précieux" },
  { word: "AN", definition: "Période de douze mois" },
  { word: "UT", definition: "Ancienne note de musique" },
  { word: "US", definition: "Coutumes et traditions" },
  { word: "AS", definition: "Carte majeure" },
  { word: "UN", definition: "Chiffre unité" },
  { word: "ET", definition: "Conjonction d'union" },
  { word: "LI", definition: "Mesure chinoise" },
  { word: "PI", definition: "Rapport du cercle" },
  { word: "RE", definition: "Note de musique" },
  { word: "SI", definition: "Hypothèse" },

  // Mots 3 lettres
  { word: "EAU", definition: "Indispensable à la vie" },
  { word: "RUE", definition: "Voie urbaine" },
  { word: "AIR", definition: "Atmosphère fluide" },
  { word: "AIL", definition: "Gousse aromatique" },
  { word: "BAC", definition: "Bateau de traversée" },
  { word: "COL", definition: "Passage entre montagnes" },
  { word: "MER", definition: "Grande étendue salée" },
  { word: "NID", definition: "Habitat d'oiseau" },
  { word: "ILE", definition: "Terre entourée d'eau" },
  { word: "ARC", definition: "Arme de tir à flèche" },
  { word: "SUD", definition: "Point cardinal" },
  { word: "EST", definition: "Orientation du soleil" },
  { word: "NEZ", definition: "Organe de l'odorat" },
  { word: "BUS", definition: "Transport en commun" },
  { word: "LIT", definition: "Meuble de repos" },
  { word: "FER", definition: "Métal solide" },
  { word: "COQ", definition: "Chante au lever" },

  // Mots 4 lettres
  { word: "CHAT", definition: "Petit félin domestique" },
  { word: "PAIN", definition: "Aliment de base" },
  { word: "LION", definition: "Roi de la savane" },
  { word: "LUNE", definition: "Satellite terrestre" },
  { word: "PONT", definition: "Franchit une rivière" },
  { word: "VENT", definition: "Déplacement d'air" },
  { word: "PORT", definition: "Bassin pour bateaux" },
  { word: "SANG", definition: "Fluide vital rouge" },
  { word: "GARE", definition: "Arrêt de trains" },
  { word: "BOIS", definition: "Matière d'arbre" },
  { word: "TOUR", definition: "Haute structure" },
  { word: "ROSE", definition: "Fleur parfumée" },
  { word: "CAFE", definition: "Boisson stimulante" },

  // Mots 5 à 7 lettres
  { word: "ARBRE", definition: "Végétal à tronc" },
  { word: "PLUIE", definition: "Averse du ciel" },
  { word: "SOLEIL", definition: "Étoile du système" },
  { word: "NAVIRE", definition: "Grand bateau" },
  { word: "FLEUVE", definition: "Cours d'eau important" },
  { word: "OISEAU", definition: "Animal à plumes" },
  { word: "JARDIN", definition: "Espace végétal" },
  { word: "MAISON", definition: "Habitation" },
  { word: "NUAGE", definition: "Vapeur dans le ciel" },

  // Grandes Ancres (8 à 10 lettres)
  { word: "MONTAGNE", definition: "Relief très élevé" },
  { word: "ELECTRON", definition: "Particule négative" },
  { word: "AEROPORT", definition: "Espace pour avions" },
  { word: "ASTRONAUTE", definition: "Voyageur de l'espace" },
  { word: "BIBLIOTHEQUE", definition: "Lieu plein de livres" }
];

// Ajout automatique du champ 'length'
const words = rawWords.map((item) => ({
  ...item,
  length: item.word.length,
}));

async function seed() {
  console.log(`Insertion de ${words.length} mots avec calcul de longueur...`);

  const { data, error } = await supabase
    .from('dictionary')
    .upsert(words, { onConflict: 'word' });

  if (error) {
    console.error("Erreur d'insertion dans le dictionnaire :", error.message);
  } else {
    console.log("✅ Dictionnaire enrichi avec succès !");
  }
}

seed();