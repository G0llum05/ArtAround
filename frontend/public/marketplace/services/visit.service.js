export class VisitService {
    static apiUrl = "/api/visit";

    static async getTop10VisitPresentation() {
      try {
        const response = await fetch(`${this.apiUrl}/homePresentation`, {
          method: "GET",
        });
        if (!response.ok) {
          throw new Error(response.statusText);
        }

        const data = await response.json();
        return data;
      } catch (error){
        console.error(error);
      }
    }

    static async createVisit(visit) {
      try{
        const response = await fetch(`${this.apiUrl}/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(visit),
        });
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        return await response;
      } catch (error){
        console.error(error);
      }
    }

    static async getAllVisits() {
      try {
        const response = await fetch(`${this.apiUrl}`, {
          method: "GET",
        });
        if (!response.ok) {
          throw new Error(response.statusText);
        }

        const data = await response.json();
        return data;
      } catch (error){
        console.error(error);
      }
    }

    static async getVisit(visitId) {
      try{
        const response = await fetch(`${this.apiUrl}/${visitId}`, {
            method: "GET",
        })
        if (!response.ok) {
          throw new Error(response.statusText);
        }

        const data = await response.json();
        return data;
      } catch (error){
        console.error(error);
      }
    }

    static async getVisitsWithMoreThanTenArtworks() {
      try {
        const response = await fetch(`${this.apiUrl}/more-than-10-artworks`,{
          method: "GET",
        });
        if(!response.ok) {
          throw new Error(response.statusText);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error(error);
      }
    }

    static async postView(visitId) {
      try{
        const response = await fetch(`${this.apiUrl}/${visitId}/view`, {
          method: "POST",
        })
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        return response.ok
      } catch (error){
        console.error(error);
      }
    }

    static async purchaseVisit(visitId, userId) {
      try {
        const response = await fetch(`${this.apiUrl}/${visitId}/purchase`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        });
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        return await response.json();
      } catch (error) {
        console.error("Errore acquisto visita:", error);
        try {
          const userResp = await fetch(`/api/user/${userId}/purchase-visit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ visitId, userId }),
          });
          if (userResp.ok) return await userResp.json();
        } catch (err) {
          console.error("Errore fallback acquisto:", err);
        }
      }
    }

    static async getUserPurchasedVisits(userId) {
      if (!userId) return [];
      try {
        const response = await fetch(`/api/user/${userId}`);
        if (response.ok) {
          const data = await response.json();
          const list = data.purchasedVisits || [];
          return list.map(v => (v && (v.id || v._id)) ? (v.id || v._id).toString() : String(v));
        }
      } catch (e) {
        console.warn("Errore recupero visite acquistate utente:", e);
      }
      return [];
    }
}
