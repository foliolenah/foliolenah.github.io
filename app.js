// Portfolio v2: interacciones. Todo funciona sin esto (el contenido se ve igual); acá solo se suma movimiento.
(() => {
  const raiz = document.documentElement;
  const pocoMovimiento = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const punteroFino = matchMedia("(pointer: fine)").matches;

  // ---------- Tema (noche / marfil) ----------
  const botonesTema = document.querySelectorAll(".temas button");
  const marcarTema = (t) => botonesTema.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.set === t)));
  marcarTema(raiz.dataset.theme);
  botonesTema.forEach((b) => b.addEventListener("click", () => {
    raiz.dataset.theme = b.dataset.set;
    marcarTema(b.dataset.set);
    try { localStorage.setItem("tema", b.dataset.set); } catch (e) {}
  }));

  // ---------- Menú a pantalla completa ----------
  const btnMenu = document.querySelector(".btn-menu");
  const menu = document.getElementById("menu");
  const enlacesMenu = menu.querySelectorAll("a");
  enlacesMenu.forEach((a) => a.setAttribute("tabindex", "-1"));
  const abrirMenu = (abrir) => {
    btnMenu.setAttribute("aria-expanded", String(abrir));
    btnMenu.querySelector("span").textContent = abrir ? "Cerrar" : "Menú";
    menu.classList.toggle("abierto", abrir);
    menu.setAttribute("aria-hidden", String(!abrir));
    enlacesMenu.forEach((a) => a.setAttribute("tabindex", abrir ? "0" : "-1"));
    document.body.style.overflow = abrir ? "hidden" : "";
    if (abrir) setTimeout(() => enlacesMenu[0].focus(), 300);
  };
  btnMenu.addEventListener("click", () => abrirMenu(btnMenu.getAttribute("aria-expanded") !== "true"));
  enlacesMenu.forEach((a) => a.addEventListener("click", () => abrirMenu(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.classList.contains("abierto")) { abrirMenu(false); btnMenu.focus(); }
  });

  // ---------- Barra de progreso y fondo de la navegación ----------
  const progreso = document.querySelector(".progreso");
  const nav = document.querySelector(".nav");
  const trazo = document.querySelector(".tiempo .trazo");
  const tiempo = document.querySelector(".tiempo");
  const alScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progreso.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    nav.classList.toggle("con-fondo", scrollY > 30);
    if (trazo && tiempo) {
      const r = tiempo.getBoundingClientRect();
      const avance = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.3)));
      trazo.style.setProperty("--avance", pocoMovimiento ? 1 : avance.toFixed(3));
    }
  };
  addEventListener("scroll", alScroll, { passive: true });
  alScroll();

  // ---------- Entrada del hero ----------
  requestAnimationFrame(() => document.querySelector(".hero").classList.add("cargado"));

  // ---------- Apariciones y contadores ----------
  const contar = (el) => {
    const fin = Number(el.dataset.cuenta);
    if (pocoMovimiento) { el.textContent = fin; return; }
    const t0 = performance.now(), dur = 1400;
    const paso = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(fin * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  };
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.remove("pendiente");
      en.target.querySelectorAll("[data-cuenta]").forEach(contar);
      observador.unobserve(en.target);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  // Lo que ya se ve al cargar queda quieto; solo lo que está más abajo entra con un desplazamiento (nunca oculto).
  document.querySelectorAll(".aparece").forEach((el) => {
    if (!pocoMovimiento && el.getBoundingClientRect().top > innerHeight) el.classList.add("pendiente");
    observador.observe(el);
  });

  // ---------- Profundidad: objetos del hero siguen al mouse ----------
  if (punteroFino && !pocoMovimiento) {
    const objetos = document.querySelectorAll(".obj");
    document.querySelector(".hero").addEventListener("pointermove", (e) => {
      const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
      objetos.forEach((o) => {
        const p = Number(o.dataset.prof || 20);
        const svg = o.querySelector("svg");
        svg.style.setProperty("--px", `${(-x * p).toFixed(1)}px`);
        svg.style.setProperty("--py", `${(-y * p).toFixed(1)}px`);
      });
    });
  }

  // ---------- Tarjetas que se inclinan ----------
  if (punteroFino && !pocoMovimiento) {
    document.querySelectorAll(".tarjeta").forEach((t) => {
      t.addEventListener("pointermove", (e) => {
        const r = t.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        t.style.setProperty("--ry", `${(x * 6).toFixed(2)}deg`);
        t.style.setProperty("--rx", `${(-y * 6).toFixed(2)}deg`);
      });
      t.addEventListener("pointerleave", () => { t.style.setProperty("--rx", "0deg"); t.style.setProperty("--ry", "0deg"); });
    });
  }

  // ---------- Popups de los casos ----------
  const orden = [...new Set([...document.querySelectorAll("[data-caso]")].map((t) => t.dataset.caso))];
  let origen = null;
  const cerrarDialogo = (d, luego) => {
    if (pocoMovimiento) { d.close(); luego && luego(); return; }
    d.classList.add("cerrando");
    setTimeout(() => { d.classList.remove("cerrando"); d.close(); luego && luego(); }, 230);
  };
  const abrirDialogo = (id) => {
    const d = document.getElementById(id);
    if (!d) return;
    d.showModal();
    d.querySelector(".d-cuerpo").scrollTop = 0;
  };
  document.querySelectorAll("[data-caso]").forEach((t) => t.addEventListener("click", () => {
    origen = t;
    abrirDialogo(t.dataset.caso);
  }));
  document.querySelectorAll("dialog.caso").forEach((d) => {
    const mover = (delta) => {
      const i = orden.indexOf(d.id);
      const sig = orden[(i + delta + orden.length) % orden.length];
      origen = document.querySelector(`[data-caso="${sig}"]`);
      cerrarDialogo(d, () => abrirDialogo(sig));
    };
    d.querySelector(".cerrar").addEventListener("click", () => cerrarDialogo(d));
    d.querySelector(".ant").addEventListener("click", () => mover(-1));
    d.querySelector(".sig").addEventListener("click", () => mover(1));
    d.addEventListener("click", (e) => { if (e.target === d) cerrarDialogo(d); });
    d.addEventListener("cancel", (e) => { e.preventDefault(); cerrarDialogo(d); });
    d.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") mover(1);
      if (e.key === "ArrowLeft") mover(-1);
    });
    d.addEventListener("close", () => { if (origen && !document.querySelector("dialog[open]")) origen.focus(); });
  });

  // Los casos destacados se abren tocando cualquier parte del bloque, no solo el botón.
  document.querySelectorAll(".destacado").forEach((d) => d.addEventListener("click", (e) => {
    if (!e.target.closest("button")) d.querySelector("[data-caso]").click();
  }));

  // ---------- Índice de casos: la captura sigue al cursor ----------
  const flotante = document.querySelector(".vista-flotante");
  if (flotante && punteroFino && !pocoMovimiento) {
    const img = flotante.querySelector("img");
    document.querySelectorAll(".fila[data-img]").forEach((f) => {
      f.addEventListener("pointerenter", () => { img.src = f.dataset.img; flotante.classList.add("on"); });
      f.addEventListener("pointerleave", () => flotante.classList.remove("on"));
      f.addEventListener("pointermove", (e) => {
        const x = e.clientX + 368 > innerWidth ? e.clientX - 368 : e.clientX + 28;
        flotante.style.setProperty("--vx", `${x}px`);
        flotante.style.setProperty("--vy", `${e.clientY - 110}px`);
      });
    });
  }

  // ---------- La alerta que se arma sola ----------
  const tabla = document.getElementById("tabla-viva");
  const pasos = document.querySelectorAll("#relato li");
  let temporizadores = [];
  const reproducir = () => {
    temporizadores.forEach(clearTimeout);
    temporizadores = [];
    tabla.classList.remove("reproducir", "alarma");
    tabla.querySelectorAll(".barra").forEach((b) => { b.style.width = "0"; });
    pasos.forEach((p) => p.classList.remove("on"));
    const en = (ms, fn) => temporizadores.push(setTimeout(fn, pocoMovimiento ? 0 : ms));
    en(50, () => { pasos[0].classList.add("on"); });
    en(700, () => {
      tabla.classList.add("reproducir");
      pasos[1].classList.add("on");
      tabla.querySelectorAll(".barra").forEach((b) => { b.style.width = `${Math.max(4, Number(b.dataset.w))}px`; });
    });
    en(2000, () => {
      tabla.classList.add("alarma");
      tabla.querySelector(".critico .barra").style.width = "72px";
      pasos[2].classList.add("on");
    });
    en(3300, () => { pasos[3].classList.add("on"); });
  };
  new IntersectionObserver((ent, obs) => {
    if (ent[0].isIntersecting) { reproducir(); obs.disconnect(); }
  }, { threshold: 0.25 }).observe(tabla);
  document.getElementById("repetir").addEventListener("click", reproducir);

  // ---------- Paneles que se expanden ----------
  const paneles = document.querySelectorAll("#paneles .panel");
  const activar = (p) => paneles.forEach((x) => x.setAttribute("aria-expanded", String(x === p)));
  paneles.forEach((p) => {
    p.addEventListener("click", () => activar(p));
    if (punteroFino) p.addEventListener("mouseenter", () => activar(p));
  });
})();
