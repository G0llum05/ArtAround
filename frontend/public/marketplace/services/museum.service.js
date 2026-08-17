export class MuseumService {

  static apiUrl = "http://localhost:8000/api/museum";

  static async getAllHomePresentationMuseums() {
    try {
      const response = await fetch(`${this.apiUrl}`, {
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(error);
    }
  }
  static async getVisitsByMuseumId(id) {
    try{
      const response = await fetch(`${this.apiUrl}/${id}/visits`, {
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }
    } catch (error){
      console.error(error);
    }
  }
}
