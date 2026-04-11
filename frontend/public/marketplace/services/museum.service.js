export const MuseumService = {
    getAll(fetchFn) {
        return fetchFn('/api/museum').then(r => r.json());
    },

    getVisitsByMuseumId(fetchFn) {
        return fetchFn('/api/museum/:id/visits').then(r => r.json());
    },

    // searchByName(reqParameters, fetchFn) {
    //     return fetchFn('/api/museum/name').then( r => r.json());
    // },

    create(payload, fetchFn) {
        return fetchFn('/api/museum', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    },

    update(payload, fetchFn) {
        return fetchFn('/api/museum/:id', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    },

    delete(fetchFn) {
        return fetchFn('/api/museum/:id', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        })
    }

}