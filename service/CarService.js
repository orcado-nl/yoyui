export const CarService = {
    brands: ['Vapid', 'Carson', 'Kitano', 'Dabver', 'Ibex', 'Morello', 'Akira', 'Titan', 'Dover', 'Norma'],

    colors: ['Black', 'White', 'Red', 'Blue', 'Silver', 'Green', 'Yellow'],

    generateCar(id) {
        return {
            id,
            vin: this.generateVin(),
            brand: this.generateBrand(),
            color: this.generateColor(),
            year: this.generateYear()
        };
    },

    generateVin() {
        let text = '';
        let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (let i = 0; i < 5; i++) {
            text += possible.charAt(crypto.getRandomValues(new Uint32Array(1))[0] % possible.length);
        }

        return text;
    },

    generateBrand() {
        return this.brands[crypto.getRandomValues(new Uint32Array(1))[0] % 10];
    },

    generateColor() {
        return this.colors[crypto.getRandomValues(new Uint32Array(1))[0] % 7];
    },

    generateYear() {
        return 2000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 19);
    }
};
