class PizzaGame {
  constructor(opts = {}) {
    this.tick = 0;
    this.pizzas = 0;
    // customers is a queue of waiting customers {id, waited}
    this.customers = [];
    // ingredient units (integer). Each pizza consumes 4 units.
    this.ingredients = 180;
    this.money = 0;
    // current price for a worker's ingredient trip (changes every 5 ticks)
    this.ingredientPrice = 150;
    this.reputation = 100;
    this.intervalMs = 2000;
    this.price = 8;
    this.baseCustomers = 1;
    this._timer = null;
    this.running = false;
    this.lastMessage = '';
    this._nextCustomerId = 1;
    // worker state: fetching boolean and remaining ticks until return
    this.worker = { fetching: false, remaining: 0 };
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

    // spawn new customers
    const newCust = this.baseCustomers + Math.floor(Math.random() * 3);
    for (let i = 0; i < newCust; i++) {
      this.customers.push({ id: this._nextCustomerId++, waited: 0 });
    }

    // Try to serve waiting customers with available pizzas
    this._serveCustomers();

    // Increase wait counters and handle leaving customers
    let left = 0;
    const remaining = [];
    for (const c of this.customers) {
      c.waited += 1;
      if (c.waited >= 10) {
        left += 1;
        this.reputation = Math.max(0, this.reputation - 1); // reduce reputation per leaving customer
      } else {
        remaining.push(c);
      }
    }
    this.customers = remaining;

    if (newCust > 0 || left > 0) {
      this.lastMessage = `Arrived ${newCust}, left ${left}`;
    } else {
      this.lastMessage = null;
    }

    // normalize reputation
    this.reputation = Math.max(0, Math.min(200, this.reputation));

    // handle worker countdown
    if (this.worker.fetching) {
      this.worker.remaining -= 1;
      if (this.worker.remaining <= 0) {
        this.worker.fetching = false;
        this.worker.remaining = 0;
        const arrived = 150; // units fetched
        this.ingredients += arrived;
        this.lastMessage = `Worker returned with ${arrived} ingredient units`;
      }
    }

    // fluctuate ingredient price every 5 ticks
    if (this.tick % 5 === 0) {
      this.ingredientPrice = 100 + Math.floor(Math.random() * 101); // 100..200
    }

    this.notify();
  }

  // create one pizza (manual action); try to serve immediately
  makePizza() {
    // need 4 ingredient units per pizza
    if (this.ingredients < 4) {
      this.lastMessage = 'Not enough ingredients to make pizza';
      this.notify();
      return false;
    }
    this.ingredients -= 4;
    this.pizzas += 1;
    this.lastMessage = 'Made 1 pizza';
    this._serveCustomers();
    this.notify();
    return true;
  }

  // send a worker to fetch ingredients (returns true if dispatched)
  sendWorker() {
    if (this.worker.fetching) {
      this.lastMessage = 'Worker already fetching';
      this.notify();
      return false;
    }
    // prevent dispatch if not enough money
    if (this.money < this.ingredientPrice) {
      this.lastMessage = 'Nicht genug Geld, um Arbeiter zu schicken';
      this.notify();
      return false;
    }
    this.worker.fetching = true;
    this.worker.remaining = 10; // ticks until return
    // charge money immediately
    this.money -= this.ingredientPrice;
    this.lastMessage = `Worker dispatched to fetch ingredients (cost $${this.ingredientPrice.toFixed(2)})`;
    this.notify();
    return true;
  }

  _serveCustomers() {
    let sold = 0;
    while (this.pizzas > 0 && this.customers.length > 0) {
      // serve first waiting customer
      this.pizzas -= 1;
      const c = this.customers.shift();
      this.money += this.price;
      this.reputation = Math.min(200, this.reputation + 0.1);
      sold += 1;
    }
    if (sold > 0) {
      this.lastMessage = `Served ${sold} customer(s)`;
    }
    return sold;
  }

  reset() {
    if (this.running) this.stop();
    this.tick = 0;
    this.pizzas = 0;
    this.customers = [];
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
      customers: (this.customers && this.customers.length) || 0,
      ingredients: this.ingredients,
      ingredientPrice: this.ingredientPrice,
      worker: { fetching: this.worker.fetching, remaining: this.worker.remaining },
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
