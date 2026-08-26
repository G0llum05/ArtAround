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

    static async postView(visitId) {
      try{
        const response = await fetch(`${this.apiUrl}/${visitId}/view`, {
          method: "POST",
        })
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        return response.ok
      } catch (error){
        console.error(error);
      }
    }
}
