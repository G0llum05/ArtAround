export const ArtworkService = {

  getAll(fetchFn) {
    return fetchFn('/api/artwork').then(r => r.json());
  },

  getOne(id, fetchFn) {
    return fetchFn(`/api/artwork/${id}`).then(r => r.json());
  }
};
