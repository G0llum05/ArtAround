export const MuseumViews = {
    museum(museums = []) {
        console.log('Rendering musuem view with museums:', museums);
        const museumList = museums.map(museum => `
            <div class="mkt-item">
                <p>${museum.name}</p>
            </div>
            `).join('');

        return `
            <div class="mkt-container">
                <h1 class="mkt-title">Musei ArtAround</h1>
                <a class="mkt-back" data-navigate="/marketplace">← Torna al marketplace</a>
                <br>
                <a class="mkt-link" data-navigate="/marketplace/museums/add">Aggiungi Museo</a>
                <div class="mkt-list">
                    ${museums.length > 0 ? museumList : '<p>Nessun museo trovato</p>'}
                </div>
            </div>
        `;
    },
    add() {
        return `                                                                                                       
         <div class="mkt-container">                                                                                
         <a class="mkt-back" data-navigate="/marketplace/museums">← Torna agli artisti</a>                          
         <a class="mkt-back" data-navigate="/marketplace/museums">← Torna ai musei</a>                              
         <form class="mkt-form" id="add-museums-form">                                                              
             <h1 class="mkt-title">Aggiungi Museo</h1>                                                              
                                                                                                                    
             <div class="mkt-field">                                                                                
                 <label for="name"></label>                                                                         
                 <label for="name">Nome</label>                                                                     
                 <input type="text" id="name" name="name" required>                                                 
             </div>                                                                                                 
                                                                                                                    
             <div class="mkt-field">                                                                                
                 <label for="description">Descrizione</label>                                                       
                 <textarea id="description" name="description"></textarea>                                          
             </div>                                                                                                 
                                                                                                                    
             <h2>Indirizzo</h2>                                                                                     
             <div class="mkt-field">                                                                                
                 <label for="street">Via</label>                                                                    
                 <input type="text" id="street" name="address.street">                                              
             </div>                                                                                                 
             <div class="mkt-field">                                                                                
                 <label for="city">Città</label>                                                                    
                 <input type="text" id="city" name="address.city" required>                                         
             </div>                                                                                                 
             <div class="mkt-field">                                                                                
                 <label for="zipCode">CAP</label>                                                                   
                 <input type="text" id="zipCode" name="address.zipCode">                                            
             </div>                                                                                                 
             <div class="mkt-field">                                                                                
                 <label for="country">Paese</label>                                                                 
                 <input type="text" id="country" name="address.country" required>                                   
             </div>                                                                                                 
                                                                                                                    
             <h2>Contatti</h2>                                                                                      
             <div class="mkt-field">                                                                                
                 <label for="phone">Telefono</label>                                                                
                 <input type="tel" id="phone" name="contact.phone">                                                 
             </div>                                                                                                 
             <div class="mkt-field">                                                                                
                 <label for="email">Email</label>                                                                   
                 <input type="email" id="email" name="contact.email">                                               
             </div>                                                                                                 
             <div class="mkt-field">                                                                                
                 <label for="website">Sito Web</label>                                                              
                 <input type="url" id="website" name="contact.website">                                             
             </div>                                                                                                 
                                                                                                                    
             <div class="mkt-field">                                                                                
                 <label for="maxCapacity">Capacità Massima</label>                                                  
                 <input type="number" id="maxCapacity" name="maxCapacity">                                          
             </div>                                                                                                 
                                                                                                                    
             <div class="mkt-field">                                                                                
                 <label for="requirements">Requisiti di visita</label>                                              
                 <textarea id="requirements" name="requirements"></textarea>                                        
             </div>                                                                                                 
                                                                                                                    
             <div class="mkt-field mkt-checkbox">                                                                   
                 <input type="checkbox" id="isActive" name="isActive" checked>                                      
                 <label for="isActive">Attivo</label>                                                               
             </div>                                                                                                 
                                                                                                                    
             <div class="mkt-field mkt-checkbox">                                                                   
                 <input type="checkbox" id="disableFriendly" name="disableFriendly">                                
                 <label for="disableFriendly">Accessibile ai disabili</label>                                       
             </div>                                                                                                 
                                                                                                                    
             <button type="submit" class="mkt-button">Aggiungi Museo</button>                                       
         </form>                                                                                                    
         </div>                                                                                                     
     `
    },

    error(err) {
        return `<div class="mkt-error"> ${err.message} </div>`
    }
};