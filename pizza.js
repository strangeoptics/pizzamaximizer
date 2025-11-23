class PizzaGame {
  constructor(opts = {}) {
    this.tick = 0;
    this.pizzas = 0;
    this.customers = 0;
    this.money = 0;
    this.reputation = 100;
    this.intervalMs = 1000;
    this.price = 8;
    this.baseCustomers = 1;
    this._timer = null;
    this.running = false;
    this.lastMessage = '';
    this.onUpdate = typeof opts.onUpdate === 'function' ? opts.onUpdate : () => {};
  }

  setIntervalMs(ms) {
    this.intervalMs = Math.max(10, Math.round(ms));
    if (this.running) {
      this.stop();
      this.start();
    }
    this.notify(`Interval set to ${this.intervalMs} ms`);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._timer = setInterval(() => this.step(), this.intervalMs);
    this.notify('Started');
  }

  stop() {
    if (!this.running) return;
    clearInterval(this._timer);
    this._timer = null;
    this.running = false;
    this.notify('Stopped');
  }

  step() {
    this.tick += 1;

    const customers = this.baseCustomers + Math.floor(Math.random() * 3);
    this.customers = customers;

    const demandFactor = 0.5 + Math.random() * 1.5;
    const reputationFactor = Math.max(0.1, this.reputation / 100);
    const pizzasMade = Math.min(customers, Math.max(0, Math.floor(demandFactor * reputationFactor * (1 + Math.random()))));
    this.pizzas += pizzasMade;

    const income = pizzasMade * this.price;
    const expenses = 0.4 * income + Math.random() * 2; // simple expense model
    this.money += income - expenses;

    this.reputation += pizzasMade * 0.2 - Math.random() * 0.4;
    this.reputation = Math.max(0, Math.min(200, this.reputation));

    this.lastMessage = `Customers ${customers}, made ${pizzasMade} pizzas, income $${income.toFixed(2)}`;
    this.notify();
  }

  reset() {
    if (this.running) this.stop();
    this.tick = 0;
    this.pizzas = 0;
    this.customers = 0;
    this.money = 0;
    this.reputation = 100;
    this.lastMessage = 'Reset';
    this.notify();
  }

  notify(msg) {
    if (msg) this.lastMessage = msg;
    const payload = {
      tick: this.tick,
      pizzas: this.pizzas,
      customers: this.customers,
      money: this.money,
      reputation: this.reputation,
      intervalMs: this.intervalMs,
      lastMessage: this.lastMessage,
    };
    try { this.onUpdate(payload); } catch (e) { /* ignore */ }
    this.lastMessage = null;
    return payload;
  }
}

window.PizzaGame = PizzaGame;
