import{n as b,l as q,r as j,s as k,m as v}from"./scheduler.BDamwXG-.js";const a=[];function x(s,o){return{subscribe:z(s,o).subscribe}}function z(s,o=b){let r;const n=new Set;function c(t){if(k(s,t)&&(s=t,r)){const i=!a.length;for(const e of n)e[1](),a.push(e,s);if(i){for(let e=0;e<a.length;e+=2)a[e][0](a[e+1]);a.length=0}}}function l(t){c(t(s))}function f(t,i=b){const e=[t,i];return n.add(e),n.size===1&&(r=o(c,l)||b),t(s),()=>{n.delete(e),n.size===0&&r&&(r(),r=null)}}return{set:c,update:l,subscribe:f}}function B(s,o,r){const n=!Array.isArray(s),c=n?[s]:s;if(!c.every(Boolean))throw new Error("derived() expects stores as input, got a falsy value");const l=o.length<2;return x(r,(f,t)=>{let i=!1;const e=[];let d=0,p=b;const g=()=>{if(d)return;p();const u=o(n?e[0]:e,f,t);l?f(u):p=v(u)?u:b},w=c.map((u,_)=>q(u,m=>{e[_]=m,d&=~(1<<_),i&&g()},()=>{d|=1<<_}));return i=!0,g(),function(){j(w),p(),i=!1}})}function E(s){return{subscribe:s.subscribe.bind(s)}}var h;const A=((h=globalThis.__sveltekit_1cjw95g)==null?void 0:h.base)??"/dine";var y;const S=((y=globalThis.__sveltekit_1cjw95g)==null?void 0:y.assets)??A;export{E as a,S as b,A as c,B as d,x as r,z as w};
