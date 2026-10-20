const translations = {
    en: {
      greeting: "Hello!",
      message: "Welcome to my website."
    },
    fr: {
      greeting: "Bonjour !",
      message: "Bienvenue sur mon site web."
    },
    es: {
      greeting: "¡Hola!",
      message: "Bienvenido a mi sitio web."
    }
  };

  function changeLanguage(lang) {
    const elements = document.querySelectorAll("[data-translate]");
    
    elements.forEach(element => {
      const key = element.getAttribute("data-translate");
      element.textContent = translations[lang][key];
    });
  }

  



  