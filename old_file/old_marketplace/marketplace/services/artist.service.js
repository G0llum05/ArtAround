export const ArtistService = {
  getAll(fetchFn) {
    return fetchFn('/api/artist').then(r => r.json());
  },
  create(payload, fetchFn) {
    return fetchFn('/api/artist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }
};
