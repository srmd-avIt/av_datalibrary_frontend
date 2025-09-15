// Mock data for the data library app

export const mockCountries = Array.from({ length: 47 }, (_, i) => ({
  id: i + 1,
  name: `Country ${i + 1}`,
  code: `C${String(i + 1).padStart(2, '0')}`,
  continent: ['Asia', 'Europe', 'North America', 'South America', 'Africa', 'Oceania'][i % 6],
  population: Math.floor(Math.random() * 100000000) + 1000000,
  pratishthas: Math.floor(Math.random() * 50) + 1,
  padhramanis: Math.floor(Math.random() * 30) + 1,
  totalHours: Math.floor(Math.random() * 2000) + 100,
  lastVisited: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
  status: ['Active', 'Planned', 'Completed'][Math.floor(Math.random() * 3)]
}));

export const mockCities = Array.from({ length: 312 }, (_, i) => ({
  id: i + 1,
  name: `City ${i + 1}`,
  country: mockCountries[i % mockCountries.length].name,
  population: Math.floor(Math.random() * 10000000) + 50000,
  satsangHours: Math.floor(Math.random() * 500) + 10,
  attendees: Math.floor(Math.random() * 5000) + 50,
  lastEvent: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
  coordinator: `Coordinator ${i + 1}`,
  status: ['Active', 'Inactive', 'Pending'][Math.floor(Math.random() * 3)]
}));

const spiritualTopics = [
  'The Power of Inner Peace', 'Living with Purpose', 'Understanding Dharma', 'The Journey Within',
  'Meditation and Mindfulness', 'Service to Humanity', 'The Nature of Truth', 'Compassion in Daily Life',
  'Overcoming Challenges', 'Finding Balance', 'The Path of Devotion', 'Wisdom from Ancient Texts',
  'Love and Forgiveness', 'Spiritual Growth', 'The Science of Happiness', 'Unity in Diversity',
  'Faith and Surrender', 'The Power of Prayer', 'Inner Transformation', 'Divine Grace'
];

const speakers = [
  'Pujya Swami Chidanand Saraswati', 'Sadhvi Bhagawati Saraswati', 'Dr. Vishwanath Pandit',
  'Brahmacharini Divya Bharti', 'Acharya Balkrishna', 'Swami Avdheshanand Giri', 'Dr. Pranav Pandya',
  'Sadhvi Swaroopa Bharti', 'Brahmacharya Shubham Bharti', 'Dr. Sanjay Teotia'
];

export const mockSatsangHours = Array.from({ length: 500 }, (_, i) => {
  const eventTypes = ['Satsang', 'Discourse', 'Prayer Meeting', 'Festival'];
  const selectedType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  
  return {
    id: i + 1,
    date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
    location: mockCities[i % mockCities.length].name,
    country: mockCountries[i % mockCountries.length].name,
    duration: Math.floor(Math.random() * 8) + 1,
    attendees: Math.floor(Math.random() * 200) + 10,
    topic: spiritualTopics[i % spiritualTopics.length],
    speaker: speakers[i % speakers.length],
    type: selectedType,
    notes: `${selectedType} on ${spiritualTopics[i % spiritualTopics.length]}. A transformative session focusing on spiritual growth and inner development. Participants engaged in meaningful discussions and meditation practices.`
  };
});

export const mockPratishthas = Array.from({ length: 125 }, (_, i) => ({
  id: i + 1,
  name: `Pratishtha ${i + 1}`,
  location: mockCities[i % mockCities.length].name,
  country: mockCountries[i % mockCountries.length].name,
  establishedDate: new Date(2000 + Math.floor(Math.random() * 24), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
  capacity: Math.floor(Math.random() * 1000) + 100,
  weeklyEvents: Math.floor(Math.random() * 10) + 1,
  coordinator: `Coordinator ${i + 1}`,
  contact: `+${Math.floor(Math.random() * 999)}-${Math.floor(Math.random() * 9999999)}`,
  status: ['Active', 'Under Construction', 'Planned'][Math.floor(Math.random() * 3)],
  facilities: ['Prayer Hall', 'Library', 'Guest House', 'Garden'][Math.floor(Math.random() * 4)]
}));

export const mockPadhramanis = Array.from({ length: 89 }, (_, i) => ({
  id: i + 1,
  name: `Padhramani ${i + 1}`,
  location: mockCities[i % mockCities.length].name,
  country: mockCountries[i % mockCountries.length].name,
  establishedDate: new Date(2005 + Math.floor(Math.random() * 19), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
  capacity: Math.floor(Math.random() * 500) + 50,
  monthlyEvents: Math.floor(Math.random() * 8) + 1,
  coordinator: `Coordinator ${i + 1}`,
  contact: `+${Math.floor(Math.random() * 999)}-${Math.floor(Math.random() * 9999999)}`,
  status: ['Active', 'Seasonal', 'Planned'][Math.floor(Math.random() * 3)],
  type: ['Community Center', 'Study Circle', 'Youth Center'][Math.floor(Math.random() * 3)]
}));