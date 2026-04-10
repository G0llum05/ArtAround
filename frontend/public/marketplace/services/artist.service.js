export const ArtistService = {
  create(payload, fetchFn) {
    console.log('Creating artist with payload:', payload);
    return fetchFn('/api/artist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }
};
