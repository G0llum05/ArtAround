export class VisitService {
    static apiUrl = "http://localhost:8000/api/visit";

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
}
