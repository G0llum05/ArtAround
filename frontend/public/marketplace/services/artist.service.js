export const ArtistService = {

  getAll(fetchFn) {
    return fetchFn('/api/artist').then(r => r.json());
  },

  getOne(id, fetchFn) {
    return fetchFn(`/api/artist/${id}`).then(r => r.json());
  },

  create(payload, fetchFn) {
    return fetchFn('/api/artist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  update(id, payload, fetchFn) {
    return fetchFn(`/api/artist/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  delete(id, fetchFn) {
    return fetchFn(`/api/artist/${id}`, { method: 'DELETE' });
  }
};
