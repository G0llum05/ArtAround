export const OperaService = {

  getAll(fetchFn) {
    return fetchFn('/api/opera').then(r => r.json());
  },

  getOne(id, fetchFn) {
    return fetchFn(`/api/opera/${id}`).then(r => r.json());
  }
};
