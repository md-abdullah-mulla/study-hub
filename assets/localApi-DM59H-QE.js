const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/migrate-CjVcMT1A.js","assets/date-DlBqQBZW.js","assets/seed-BDMTeA82.js","assets/activityRepo-DXhmb3my.js","assets/routes-BD27kZRE.js","assets/index-Dih-VwRp.js","assets/index-DzENhMIJ.css"])))=>i.map(i=>d[i]);
import{a as e,i as t,r as n,t as r}from"./index-Dih-VwRp.js";var i=e(t(((e,t)=>{var n=void 0,r=function(e){return n||(n=new Promise(function(n,r){var i=e===void 0?{}:e,a=i.onAbort;i.onAbort=function(e){r(Error(e)),a&&a(e)},i.postRun=i.postRun||[],i.postRun.push(function(){n(i)}),t=void 0;var o;o||=i===void 0?{}:i;var s=!!globalThis.window,c=!!globalThis.WorkerGlobalScope;o.onRuntimeInitialized=function(){function e(e,t){switch(typeof t){case`boolean`:_e(e,+!!t);break;case`number`:fe(e,t);break;case`string`:me(e,t,-1,-1);break;case`object`:if(t===null)pe(e);else if(t.length!=null){var n=At(t.length);_.set(t,n),ge(e,n,t.length,-1),jt(n)}else ve(e,`Wrong API use : tried to return a value of an unknown type (`+t+`).`,-1);break;default:pe(e)}}function t(e,t){for(var n=[],r=0;r<e;r+=1){var i=A(t+4*r,`i32`),a=ce(i);if(a===1||a===2)i=ue(i);else if(a===3)i=O(i);else if(a===4){a=i,i=le(a),a=k(a);for(var o=new Uint8Array(i),s=0;s<i;s+=1)o[s]=_[a+s];i=o}else i=null;n.push(i)}return n}function n(e,t){this.Qa=e,this.db=t,this.Oa=1,this.yb=[]}function r(e,t){if(this.db=t,this.ob=wt(e),this.ob===null)throw Error(`Unable to allocate memory for the SQL string`);this.ub=this.ob,this.gb=this.Fb=null}function i(e){if(this.filename=`dbfile_`+(4294967295*Math.random()>>>0),e!=null){var t=this.filename,n=`/`,r=t;if(n&&(n=typeof n==`string`?n:Ie(n),r=t?he(n+`/`+t):n),t=De(!0,!0),r=Ze(r,t),e){if(typeof e==`string`){n=Array(e.length);for(var i=0,o=e.length;i<o;++i)n[i]=e.charCodeAt(i);e=n}rt(r,t|146),n=K(r,577),ct(n,e,0,e.length,0),at(n),rt(r,t)}}this.handleError(c(this.filename,a)),this.db=A(a,`i32`),be(this.db),this.pb={},this.Sa={}}var a=Q(4),s=o.cwrap,c=s(`sqlite3_open`,`number`,[`string`,`number`]),l=s(`sqlite3_close_v2`,`number`,[`number`]),u=s(`sqlite3_exec`,`number`,[`number`,`string`,`number`,`number`,`number`]),d=s(`sqlite3_changes`,`number`,[`number`]),f=s(`sqlite3_prepare_v2`,`number`,[`number`,`string`,`number`,`number`,`number`]),p=s(`sqlite3_sql`,`string`,[`number`]),ee=s(`sqlite3_normalized_sql`,`string`,[`number`]),m=s(`sqlite3_prepare_v2`,`number`,[`number`,`number`,`number`,`number`,`number`]),h=s(`sqlite3_bind_text`,`number`,[`number`,`number`,`number`,`number`,`number`]),g=s(`sqlite3_bind_blob`,`number`,[`number`,`number`,`number`,`number`,`number`]),te=s(`sqlite3_bind_double`,`number`,[`number`,`number`,`number`]),v=s(`sqlite3_bind_int`,`number`,[`number`,`number`,`number`]),y=s(`sqlite3_bind_parameter_index`,`number`,[`number`,`string`]),b=s(`sqlite3_step`,`number`,[`number`]),x=s(`sqlite3_errmsg`,`string`,[`number`]),S=s(`sqlite3_column_count`,`number`,[`number`]),ne=s(`sqlite3_data_count`,`number`,[`number`]),C=s(`sqlite3_column_double`,`number`,[`number`,`number`]),re=s(`sqlite3_column_text`,`string`,[`number`,`number`]),w=s(`sqlite3_column_blob`,`number`,[`number`,`number`]),T=s(`sqlite3_column_bytes`,`number`,[`number`,`number`]),ie=s(`sqlite3_column_type`,`number`,[`number`,`number`]),ae=s(`sqlite3_column_name`,`string`,[`number`,`number`]),oe=s(`sqlite3_reset`,`number`,[`number`]),se=s(`sqlite3_clear_bindings`,`number`,[`number`]),E=s(`sqlite3_finalize`,`number`,[`number`]),D=s(`sqlite3_create_function_v2`,`number`,`number string number number number number number number number`.split(` `)),ce=s(`sqlite3_value_type`,`number`,[`number`]),le=s(`sqlite3_value_bytes`,`number`,[`number`]),O=s(`sqlite3_value_text`,`string`,[`number`]),k=s(`sqlite3_value_blob`,`number`,[`number`]),ue=s(`sqlite3_value_double`,`number`,[`number`]),fe=s(`sqlite3_result_double`,``,[`number`,`number`]),pe=s(`sqlite3_result_null`,``,[`number`]),me=s(`sqlite3_result_text`,``,[`number`,`string`,`number`,`number`]),ge=s(`sqlite3_result_blob`,``,[`number`,`number`,`number`,`number`]),_e=s(`sqlite3_result_int`,``,[`number`,`number`]),ve=s(`sqlite3_result_error`,``,[`number`,`string`,`number`]),ye=s(`sqlite3_aggregate_context`,`number`,[`number`,`number`]),be=s(`RegisterExtensionFunctions`,`number`,[`number`]),M=s(`sqlite3_update_hook`,`number`,[`number`,`number`,`number`]);n.prototype.bind=function(e){if(!this.Qa)throw`Statement closed`;return this.reset(),Array.isArray(e)?this.Wb(e):typeof e==`object`&&e?this.Xb(e):!0},n.prototype.step=function(){if(!this.Qa)throw`Statement closed`;this.Oa=1;var e=b(this.Qa);switch(e){case 100:return!0;case 101:return!1;default:throw this.db.handleError(e)}},n.prototype.Pb=function(e){return e??(e=this.Oa,this.Oa+=1),C(this.Qa,e)},n.prototype.hc=function(e){if(e??(e=this.Oa,this.Oa+=1),e=re(this.Qa,e),typeof BigInt!=`function`)throw Error(`BigInt is not supported`);return BigInt(e)},n.prototype.mc=function(e){return e??(e=this.Oa,this.Oa+=1),re(this.Qa,e)},n.prototype.getBlob=function(e){e??(e=this.Oa,this.Oa+=1);var t=T(this.Qa,e);e=w(this.Qa,e);for(var n=new Uint8Array(t),r=0;r<t;r+=1)n[r]=_[e+r];return n},n.prototype.get=function(e,t){t||={},e!=null&&this.bind(e)&&this.step(),e=[];for(var n=ne(this.Qa),r=0;r<n;r+=1)switch(ie(this.Qa,r)){case 1:var i=t.useBigInt?this.hc(r):this.Pb(r);e.push(i);break;case 2:e.push(this.Pb(r));break;case 3:e.push(this.mc(r));break;case 4:e.push(this.getBlob(r));break;default:e.push(null)}return e},n.prototype.Db=function(){for(var e=[],t=S(this.Qa),n=0;n<t;n+=1)e.push(ae(this.Qa,n));return e},n.prototype.Ob=function(e,t){e=this.get(e,t),t=this.Db();for(var n={},r=0;r<t.length;r+=1)n[t[r]]=e[r];return n},n.prototype.lc=function(){return p(this.Qa)},n.prototype.ic=function(){return ee(this.Qa)},n.prototype.Jb=function(e){return e!=null&&this.bind(e),this.step(),this.reset()},n.prototype.Lb=function(e,t){t??(t=this.Oa,this.Oa+=1),e=wt(e),this.yb.push(e),this.db.handleError(h(this.Qa,t,e,-1,0))},n.prototype.Vb=function(e,t){t??(t=this.Oa,this.Oa+=1);var n=At(e.length);_.set(e,n),this.yb.push(n),this.db.handleError(g(this.Qa,t,n,e.length,0))},n.prototype.Kb=function(e,t){t??(t=this.Oa,this.Oa+=1),this.db.handleError((e===(e|0)?v:te)(this.Qa,t,e))},n.prototype.Yb=function(e){e??(e=this.Oa,this.Oa+=1),g(this.Qa,e,0,0,0)},n.prototype.Mb=function(e,t){switch(t??(t=this.Oa,this.Oa+=1),typeof e){case`string`:this.Lb(e,t);return;case`number`:this.Kb(e,t);return;case`bigint`:this.Lb(e.toString(),t);return;case`boolean`:this.Kb(e+0,t);return;case`object`:if(e===null){this.Yb(t);return}if(e.length!=null){this.Vb(e,t);return}}throw`Wrong API use : tried to bind a value of an unknown type (`+e+`).`},n.prototype.Xb=function(e){var t=this;return Object.keys(e).forEach(function(n){var r=y(t.Qa,n);r!==0&&t.Mb(e[n],r)}),!0},n.prototype.Wb=function(e){for(var t=0;t<e.length;t+=1)this.Mb(e[t],t+1);return!0},n.prototype.reset=function(){return this.Cb(),se(this.Qa)===0&&oe(this.Qa)===0},n.prototype.Cb=function(){for(var e;(e=this.yb.pop())!==void 0;)jt(e)},n.prototype.cb=function(){this.Cb();var e=E(this.Qa)===0;return delete this.db.pb[this.Qa],this.Qa=0,e},r.prototype.next=function(){if(this.ob===null)return{done:!0};if(this.gb!==null&&(this.gb.cb(),this.gb=null),!this.db.db)throw this.Ab(),Error(`Database closed`);var e=Ft(),t=Q(4);de(a),de(t);try{this.db.handleError(m(this.db.db,this.ub,-1,a,t)),this.ub=A(t,`i32`);var r=A(a,`i32`);return r===0?(this.Ab(),{done:!0}):(this.gb=new n(r,this.db),this.db.pb[r]=this.gb,{value:this.gb,done:!1})}catch(e){throw this.Fb=j(this.ub),this.Ab(),e}finally{Pt(e)}},r.prototype.Ab=function(){jt(this.ob),this.ob=null},r.prototype.jc=function(){return this.Fb===null?j(this.ub):this.Fb},typeof Symbol==`function`&&typeof Symbol.iterator==`symbol`&&(r.prototype[Symbol.iterator]=function(){return this}),i.prototype.Jb=function(e,t){if(!this.db)throw`Database closed`;if(t){e=this.Gb(e,t);try{e.step()}finally{e.cb()}}else this.handleError(u(this.db,e,0,0,a));return this},i.prototype.exec=function(e,t,r){if(!this.db)throw`Database closed`;var i=Ft(),o=null,s=null,c=null;try{c=s=wt(e);var l=Q(4);for(e=[];A(c,`i8`)!==0;){de(a),de(l),this.handleError(m(this.db,c,-1,a,l));var u=A(a,`i32`);if(c=A(l,`i32`),u!==0){var d=null;for(o=new n(u,this),t!=null&&o.bind(t);o.step();)d===null&&(d={columns:o.Db(),values:[]},e.push(d)),d.values.push(o.get(null,r));o.cb()}}return e}catch(e){throw o&&o.cb(),e}finally{s&&jt(s),Pt(i)}},i.prototype.ec=function(e,t,n,r,i){typeof t==`function`&&(r=n,n=t,t=void 0),e=this.Gb(e,t);try{for(;e.step();)n(e.Ob(null,i))}finally{e.cb()}if(typeof r==`function`)return r()},i.prototype.Gb=function(e,t){if(de(a),this.handleError(f(this.db,e,-1,a,0)),e=A(a,`i32`),e===0)throw`Nothing to prepare`;var r=new n(e,this);return t!=null&&r.bind(t),this.pb[e]=r},i.prototype.pc=function(e){return new r(e,this)},i.prototype.fc=function(){Object.values(this.pb).forEach(function(e){e.cb()}),Object.values(this.Sa).forEach(Z),this.Sa={},this.handleError(l(this.db));var e=lt(this.filename);return this.handleError(c(this.filename,a)),this.db=A(a,`i32`),be(this.db),e},i.prototype.close=function(){this.db!==null&&(Object.values(this.pb).forEach(function(e){e.cb()}),Object.values(this.Sa).forEach(Z),this.Sa={},this.fb&&=(Z(this.fb),void 0),this.handleError(l(this.db)),tt(`/`+this.filename),this.db=null)},i.prototype.handleError=function(e){if(e===0)return null;throw e=x(this.db),Error(e)},i.prototype.kc=function(){return d(this.db)},i.prototype.bc=function(n,r){Object.prototype.hasOwnProperty.call(this.Sa,n)&&(Z(this.Sa[n]),delete this.Sa[n]);var i=kt(function(n,i,a){i=t(i,a);try{var o=r.apply(null,i)}catch(e){ve(n,e,-1);return}e(n,o)},`viii`);return this.Sa[n]=i,this.handleError(D(this.db,n,r.length,1,0,i,0,0,0)),this},i.prototype.ac=function(n,r){var i=r.init||function(){return null},a=r.finalize||function(e){return e},o=r.step;if(!o)throw`An aggregate function must have a step function in `+n;var s={};Object.hasOwnProperty.call(this.Sa,n)&&(Z(this.Sa[n]),delete this.Sa[n]),r=n+`__finalize`,Object.hasOwnProperty.call(this.Sa,r)&&(Z(this.Sa[r]),delete this.Sa[r]);var c=kt(function(e,n,r){var a=ye(e,1);Object.hasOwnProperty.call(s,a)||(s[a]=i()),n=t(n,r),n=[s[a]].concat(n);try{s[a]=o.apply(null,n)}catch(t){delete s[a],ve(e,t,-1)}},`viii`),l=kt(function(t){var n=ye(t,1);try{var r=a(s[n])}catch(e){delete s[n],ve(t,e,-1);return}e(t,r),delete s[n]},`vi`);return this.Sa[n]=c,this.Sa[r]=l,this.handleError(D(this.db,n,o.length-1,1,0,0,c,l,0)),this},i.prototype.vc=function(e){return this.fb&&=(M(this.db,0,0),Z(this.fb),void 0),e?(this.fb=kt(function(t,n,r,i,a){switch(n){case 18:t=`insert`;break;case 23:t=`update`;break;case 9:t=`delete`;break;default:throw`unknown operationCode in updateHook callback: `+n}if(r=j(r),i=j(i),a>2**53-1)throw`rowId too big to fit inside a Number`;e(t,r,i,Number(a))},`viiiij`),M(this.db,this.fb,0),this):this},n.prototype.bind=n.prototype.bind,n.prototype.step=n.prototype.step,n.prototype.get=n.prototype.get,n.prototype.getColumnNames=n.prototype.Db,n.prototype.getAsObject=n.prototype.Ob,n.prototype.getSQL=n.prototype.lc,n.prototype.getNormalizedSQL=n.prototype.ic,n.prototype.run=n.prototype.Jb,n.prototype.reset=n.prototype.reset,n.prototype.freemem=n.prototype.Cb,n.prototype.free=n.prototype.cb,r.prototype.next=r.prototype.next,r.prototype.getRemainingSQL=r.prototype.jc,i.prototype.run=i.prototype.Jb,i.prototype.exec=i.prototype.exec,i.prototype.each=i.prototype.ec,i.prototype.prepare=i.prototype.Gb,i.prototype.iterateStatements=i.prototype.pc,i.prototype.export=i.prototype.fc,i.prototype.close=i.prototype.close,i.prototype.handleError=i.prototype.handleError,i.prototype.getRowsModified=i.prototype.kc,i.prototype.create_function=i.prototype.bc,i.prototype.create_aggregate=i.prototype.ac,i.prototype.updateHook=i.prototype.vc,o.Database=i};var l=`./this.program`,u=globalThis.document?.currentScript?.src;c&&(u=self.location.href);var d=``,f,p;if(s||c){try{d=new URL(`.`,u).href}catch{}c&&(p=e=>{var t=new XMLHttpRequest;return t.open(`GET`,e,!1),t.responseType=`arraybuffer`,t.send(null),new Uint8Array(t.response)}),f=async e=>{if(e=await fetch(e,{credentials:`same-origin`}),e.ok)return e.arrayBuffer();throw Error(e.status+` : `+e.url)}}var ee=console.log.bind(console),m=console.error.bind(console),h,g=!1,te,_,v,y,b,x,S,ne,C;function re(){var e=It.buffer;_=new Int8Array(e),y=new Int16Array(e),v=new Uint8Array(e),new Uint16Array(e),b=new Int32Array(e),x=new Uint32Array(e),S=new Float32Array(e),ne=new Float64Array(e),C=new BigInt64Array(e),new BigUint64Array(e)}function w(e){throw o.onAbort?.(e),e=`Aborted(`+e+`)`,m(e),g=!0,new WebAssembly.RuntimeError(e+`. Build with -sASSERTIONS for more info.`)}var T;async function ie(e){if(!h)try{var t=await f(e);return new Uint8Array(t)}catch{}if(e==T&&h)e=new Uint8Array(h);else if(p)e=p(e);else throw`both async and sync fetching of the wasm failed`;return e}async function ae(e,t){try{var n=await ie(e);return await WebAssembly.instantiate(n,t)}catch(e){m(`failed to asynchronously prepare wasm: ${e}`),w(e)}}async function oe(e){var t=T;if(!h)try{var n=fetch(t,{credentials:`same-origin`});return await WebAssembly.instantiateStreaming(n,e)}catch(e){m(`wasm streaming compile failed: ${e}`),m(`falling back to ArrayBuffer instantiation`)}return ae(t,e)}class se{name=`ExitStatus`;constructor(e){this.message=`Program terminated with exit(${e})`,this.status=e}}var E=e=>{for(;0<e.length;)e.shift()(o)},D=[],ce=[],le=()=>{var e=o.preRun.shift();ce.push(e)},O=0,k=null;function A(e,t=`i8`){switch(t.endsWith(`*`)&&(t=`*`),t){case`i1`:return _[e];case`i8`:return _[e];case`i16`:return y[e>>1];case`i32`:return b[e>>2];case`i64`:return C[e>>3];case`float`:return S[e>>2];case`double`:return ne[e>>3];case`*`:return x[e>>2];default:w(`invalid type for getValue: ${t}`)}}var ue=!0;function de(e){var t=`i32`;switch(t.endsWith(`*`)&&(t=`*`),t){case`i1`:_[e]=0;break;case`i8`:_[e]=0;break;case`i16`:y[e>>1]=0;break;case`i32`:b[e>>2]=0;break;case`i64`:C[e>>3]=BigInt(0);break;case`float`:S[e>>2]=0;break;case`double`:ne[e>>3]=0;break;case`*`:x[e>>2]=0;break;default:w(`invalid type for setValue: ${t}`)}}var fe=new TextDecoder,pe=(e,t,n,r)=>{if(n=t+n,r)return n;for(;e[t]&&!(t>=n);)++t;return t},j=(e,t,n)=>e?fe.decode(v.subarray(e,pe(v,e,t,n))):``,me=(e,t)=>{for(var n=0,r=e.length-1;0<=r;r--){var i=e[r];i===`.`?e.splice(r,1):i===`..`?(e.splice(r,1),n++):n&&(e.splice(r,1),n--)}if(t)for(;n;n--)e.unshift(`..`);return e},he=e=>{var t=e.charAt(0)===`/`,n=e.slice(-1)===`/`;return(e=me(e.split(`/`).filter(e=>!!e),!t).join(`/`))||t||(e=`.`),e&&n&&(e+=`/`),(t?`/`:``)+e},ge=e=>{var t=/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(e).slice(1);return e=t[0],t=t[1],!e&&!t?`.`:(t&&=t.slice(0,-1),e+t)},_e=e=>e&&e.match(/([^\/]+|\/)\/*$/)[1],ve=()=>e=>crypto.getRandomValues(e),ye=e=>{(ye=ve())(e)},be=(...e)=>{for(var t=``,n=!1,r=e.length-1;-1<=r&&!n;r--){if(n=0<=r?e[r]:`/`,typeof n!=`string`)throw TypeError(`Arguments to path.resolve must be strings`);if(!n)return``;t=n+`/`+t,n=n.charAt(0)===`/`}return t=me(t.split(`/`).filter(e=>!!e),!n).join(`/`),(n?`/`:``)+t||`.`},M=e=>{var t=pe(e,0);return fe.decode(e.buffer?e.subarray(0,t):new Uint8Array(e.slice(0,t)))},xe=[],N=e=>{for(var t=0,n=0;n<e.length;++n){var r=e.charCodeAt(n);127>=r?t++:2047>=r?t+=2:55296<=r&&57343>=r?(t+=4,++n):t+=3}return t},P=(e,t,n,r)=>{if(!(0<r))return 0;var i=n;r=n+r-1;for(var a=0;a<e.length;++a){var o=e.codePointAt(a);if(127>=o){if(n>=r)break;t[n++]=o}else if(2047>=o){if(n+1>=r)break;t[n++]=192|o>>6,t[n++]=128|o&63}else if(65535>=o){if(n+2>=r)break;t[n++]=224|o>>12,t[n++]=128|o>>6&63,t[n++]=128|o&63}else{if(n+3>=r)break;t[n++]=240|o>>18,t[n++]=128|o>>12&63,t[n++]=128|o>>6&63,t[n++]=128|o&63,a++}}return t[n]=0,n-i},Se=[];function Ce(e,t){Se[e]={input:[],output:[],kb:t},Je(e,we)}var we={open(e){var t=Se[e.node.nb];if(!t)throw new R(43);e.Va=t,e.seekable=!1},close(e){e.Va.kb.lb(e.Va)},lb(e){e.Va.kb.lb(e.Va)},read(e,t,n,r){if(!e.Va||!e.Va.kb.Qb)throw new R(60);for(var i=0,a=0;a<r;a++){try{var o=e.Va.kb.Qb(e.Va)}catch{throw new R(29)}if(o===void 0&&i===0)throw new R(6);if(o==null)break;i++,t[n+a]=o}return i&&(e.node.$a=Date.now()),i},write(e,t,n,r){if(!e.Va||!e.Va.kb.Hb)throw new R(60);try{for(var i=0;i<r;i++)e.Va.kb.Hb(e.Va,t[n+i])}catch{throw new R(29)}return r&&(e.node.Ua=e.node.Ta=Date.now()),i}},Te={Qb(){a:{if(!xe.length){var e=null;if(globalThis.window?.prompt&&(e=window.prompt(`Input: `),e!==null&&(e+=`
`)),!e){var t=null;break a}t=Array(N(e)+1),e=P(e,t,0,t.length),t.length=e,xe=t}t=xe.shift()}return t},Hb(e,t){t===null||t===10?(ee(M(e.output)),e.output=[]):t!=0&&e.output.push(t)},lb(e){0<e.output?.length&&(ee(M(e.output)),e.output=[])},Dc(){return{yc:25856,Ac:5,xc:191,zc:35387,wc:[3,28,127,21,4,0,1,0,17,19,26,0,18,15,23,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}},Ec(){return 0},Fc(){return[24,80]}},Ee={Hb(e,t){t===null||t===10?(m(M(e.output)),e.output=[]):t!=0&&e.output.push(t)},lb(e){0<e.output?.length&&(m(M(e.output)),e.output=[])}},F={Za:null,ab(){return F.createNode(null,`/`,16895,0)},createNode(e,t,n,r){if((n&61440)==24576||(n&61440)==4096)throw new R(63);return F.Za||={dir:{node:{Wa:F.La.Wa,Xa:F.La.Xa,mb:F.La.mb,rb:F.La.rb,Tb:F.La.Tb,xb:F.La.xb,vb:F.La.vb,Ib:F.La.Ib,wb:F.La.wb},stream:{Ya:F.Ma.Ya}},file:{node:{Wa:F.La.Wa,Xa:F.La.Xa},stream:{Ya:F.Ma.Ya,read:F.Ma.read,write:F.Ma.write,sb:F.Ma.sb,tb:F.Ma.tb}},link:{node:{Wa:F.La.Wa,Xa:F.La.Xa,eb:F.La.eb},stream:{}},Nb:{node:{Wa:F.La.Wa,Xa:F.La.Xa},stream:qe}},n=ze(e,t,n,r),V(n.mode)?(n.La=F.Za.dir.node,n.Ma=F.Za.dir.stream,n.Na={}):(n.mode&61440)==32768?(n.La=F.Za.file.node,n.Ma=F.Za.file.stream,n.Ra=0,n.Na=null):(n.mode&61440)==40960?(n.La=F.Za.link.node,n.Ma=F.Za.link.stream):(n.mode&61440)==8192&&(n.La=F.Za.Nb.node,n.Ma=F.Za.Nb.stream),n.$a=n.Ua=n.Ta=Date.now(),e&&(e.Na[t]=n,e.$a=e.Ua=e.Ta=n.$a),n},Cc(e){return e.Na?e.Na.subarray?e.Na.subarray(0,e.Ra):new Uint8Array(e.Na):new Uint8Array},La:{Wa(e){var t={};return t.cc=(e.mode&61440)==8192?e.id:1,t.oc=e.id,t.mode=e.mode,t.rc=1,t.uid=0,t.nc=0,t.nb=e.nb,t.size=V(e.mode)?4096:(e.mode&61440)==32768?e.Ra:(e.mode&61440)==40960?e.link.length:0,t.$a=new Date(e.$a),t.Ua=new Date(e.Ua),t.Ta=new Date(e.Ta),t.Zb=4096,t.$b=Math.ceil(t.size/t.Zb),t},Xa(e,t){for(var n of[`mode`,`atime`,`mtime`,`ctime`])t[n]!=null&&(e[n]=t[n]);t.size!==void 0&&(t=t.size,e.Ra!=t&&(t==0?(e.Na=null,e.Ra=0):(n=e.Na,e.Na=new Uint8Array(t),n&&e.Na.set(n.subarray(0,Math.min(t,e.Ra))),e.Ra=t)))},mb(){throw F.zb||(F.zb=new R(44),F.zb.stack=`<generic error, no stack>`),F.zb},rb(e,t,n,r){return F.createNode(e,t,n,r)},Tb(e,t,n){try{var r=B(t,n)}catch{}if(r){if(V(e.mode))for(var i in r.Na)throw new R(55);Re(r)}delete e.parent.Na[e.name],t.Na[n]=e,e.name=n,t.Ta=t.Ua=e.parent.Ta=e.parent.Ua=Date.now()},xb(e,t){delete e.Na[t],e.Ta=e.Ua=Date.now()},vb(e,t){var n=B(e,t),r;for(r in n.Na)throw new R(55);delete e.Na[t],e.Ta=e.Ua=Date.now()},Ib(e){return[`.`,`..`,...Object.keys(e.Na)]},wb(e,t,n){return e=F.createNode(e,t,41471,0),e.link=n,e},eb(e){if((e.mode&61440)!=40960)throw new R(28);return e.link}},Ma:{read(e,t,n,r,i){var a=e.node.Na;if(i>=e.node.Ra)return 0;if(e=Math.min(e.node.Ra-i,r),8<e&&a.subarray)t.set(a.subarray(i,i+e),n);else for(r=0;r<e;r++)t[n+r]=a[i+r];return e},write(e,t,n,r,i,a){if(t.buffer===_.buffer&&(a=!1),!r)return 0;if(e=e.node,e.Ua=e.Ta=Date.now(),t.subarray&&(!e.Na||e.Na.subarray)){if(a)return e.Na=t.subarray(n,n+r),e.Ra=r;if(e.Ra===0&&i===0)return e.Na=t.slice(n,n+r),e.Ra=r;if(i+r<=e.Ra)return e.Na.set(t.subarray(n,n+r),i),r}a=i+r;var o=e.Na?e.Na.length:0;if(o>=a||(a=Math.max(a,o*(1048576>o?2:1.125)>>>0),o!=0&&(a=Math.max(a,256)),o=e.Na,e.Na=new Uint8Array(a),0<e.Ra&&e.Na.set(o.subarray(0,e.Ra),0)),e.Na.subarray&&t.subarray)e.Na.set(t.subarray(n,n+r),i);else for(a=0;a<r;a++)e.Na[i+a]=t[n+a];return e.Ra=Math.max(e.Ra,i+r),r},Ya(e,t,n){if(n===1?t+=e.position:n===2&&(e.node.mode&61440)==32768&&(t+=e.node.Ra),0>t)throw new R(28);return t},sb(e,t,n,r,i){if((e.node.mode&61440)!=32768)throw new R(43);if(e=e.node.Na,i&2||!e||e.buffer!==_.buffer){i=!0,r=65536*Math.ceil(t/65536);var a=Mt(65536,r);if(a&&v.fill(0,a,a+r),r=a,!r)throw new R(48);e&&((0<n||n+t<e.length)&&(e=e.subarray?e.subarray(n,n+t):Array.prototype.slice.call(e,n,n+t)),_.set(e,r))}else i=!1,r=e.byteOffset;return{tc:r,Ub:i}},tb(e,t,n,r){return F.Ma.write(e,t,0,r,n,!1),0}}},De=(e,t)=>{var n=0;return e&&(n|=365),t&&(n|=146),n},Oe=null,ke={},I=[],Ae=1,L=null,je=!1,Me=!0,Ne={},R=class{name=`ErrnoError`;constructor(e){this.Pa=e}},Pe=class{qb={};node=null;get flags(){return this.qb.flags}set flags(e){this.qb.flags=e}get position(){return this.qb.position}set position(e){this.qb.position=e}},Fe=class{La={};Ma={};ib=null;constructor(e,t,n,r){e||=this,this.parent=e,this.ab=e.ab,this.id=Ae++,this.name=t,this.mode=n,this.nb=r,this.$a=this.Ua=this.Ta=Date.now()}get read(){return(this.mode&365)==365}set read(e){e?this.mode|=365:this.mode&=-366}get write(){return(this.mode&146)==146}set write(e){e?this.mode|=146:this.mode&=-147}};function z(e,t={}){if(!e)throw new R(44);t.Bb??=!0,e.charAt(0)===`/`||(e=`//`+e);var n=0;a:for(;40>n;n++){e=e.split(`/`).filter(e=>!!e);for(var r=Oe,i=`/`,a=0;a<e.length;a++){var o=a===e.length-1;if(o&&t.parent)break;if(e[a]!==`.`){if(e[a]===`..`){if(i=ge(i),r===r.parent){e=i+`/`+e.slice(a+1).join(`/`),n--;continue a}r=r.parent}else{i=he(i+`/`+e[a]);try{r=B(r,e[a])}catch(e){if(e?.Pa===44&&o&&t.sc)return{path:i};throw e}if(!r.ib||o&&!t.Bb||(r=r.ib.root),(r.mode&61440)==40960&&(!o||t.hb)){if(!r.La.eb)throw new R(52);r=r.La.eb(r),r.charAt(0)===`/`||(r=ge(i)+`/`+r),e=r+`/`+e.slice(a+1).join(`/`);continue a}}}}return{path:i,node:r}}throw new R(32)}function Ie(e){for(var t;;){if(e===e.parent)return e=e.ab.Sb,t?e[e.length-1]===`/`?e+t:`${e}/${t}`:e;t=t?`${e.name}/${t}`:e.name,e=e.parent}}function Le(e,t){for(var n=0,r=0;r<t.length;r++)n=(n<<5)-n+t.charCodeAt(r)|0;return(e+n>>>0)%L.length}function Re(e){var t=Le(e.parent.id,e.name);if(L[t]===e)L[t]=e.jb;else for(t=L[t];t;){if(t.jb===e){t.jb=e.jb;break}t=t.jb}}function B(e,t){var n=V(e.mode)?(n=H(e,`x`))?n:e.La.mb?0:2:54;if(n)throw new R(n);for(n=L[Le(e.id,t)];n;n=n.jb){var r=n.name;if(n.parent.id===e.id&&r===t)return n}return e.La.mb(e,t)}function ze(e,t,n,r){return e=new Fe(e,t,n,r),t=Le(e.parent.id,e.name),e.jb=L[t],L[t]=e}function V(e){return(e&61440)==16384}function Be(e){var t=[`r`,`w`,`rw`][e&3];return e&512&&(t+=`w`),t}function H(e,t){if(Me)return 0;if(!t.includes(`r`)||e.mode&292){if(t.includes(`w`)&&!(e.mode&146)||t.includes(`x`)&&!(e.mode&73))return 2}else return 2;return 0}function Ve(e,t){if(!V(e.mode))return 54;try{return B(e,t),20}catch{}return H(e,`wx`)}function He(e,t,n){try{var r=B(e,t)}catch(e){return e.Pa}if(e=H(e,`wx`))return e;if(n){if(!V(r.mode))return 54;if(r===r.parent||Ie(r)===`/`)return 10}else if(V(r.mode))return 31;return 0}function Ue(e){if(!e)throw new R(63);return e}function U(e){if(e=I[e],!e)throw new R(8);return e}function We(e,t=-1){if(e=Object.assign(new Pe,e),t==-1)a:{for(t=0;4096>=t;t++)if(!I[t])break a;throw new R(33)}return e.bb=t,I[t]=e}function Ge(e,t=-1){return e=We(e,t),e.Ma?.Bc?.(e),e}function Ke(e,t,n){var r=e?.Ma.Xa;e=r?e:t,r??=t.La.Xa,Ue(r),r(e,n)}var qe={open(e){e.Ma=ke[e.node.nb].Ma,e.Ma.open?.(e)},Ya(){throw new R(70)}};function Je(e,t){ke[e]={Ma:t}}function Ye(e,t){var n=t===`/`;if(n&&Oe)throw new R(10);if(!n&&t){var r=z(t,{Bb:!1});if(t=r.path,r=r.node,r.ib)throw new R(10);if(!V(r.mode))throw new R(54)}t={type:e,Gc:{},Sb:t,qc:[]},e=e.ab(t),e.ab=t,t.root=e,n?Oe=e:r&&(r.ib=t,r.ab&&r.ab.qc.push(t))}function Xe(e,t,n){var r=z(e,{parent:!0}).node;if(e=_e(e),!e)throw new R(28);if(e===`.`||e===`..`)throw new R(20);var i=Ve(r,e);if(i)throw new R(i);if(!r.La.rb)throw new R(63);return r.La.rb(r,e,t,n)}function Ze(e,t=438){return Xe(e,t&4095|32768,0)}function W(e,t=511){return Xe(e,t&1023|16384,0)}function Qe(e,t,n){n===void 0&&(n=t,t=438),Xe(e,t|8192,n)}function $e(e,t){if(!be(e))throw new R(44);var n=z(t,{parent:!0}).node;if(!n)throw new R(44);t=_e(t);var r=Ve(n,t);if(r)throw new R(r);if(!n.La.wb)throw new R(63);n.La.wb(n,t,e)}function et(e){var t=z(e,{parent:!0}).node;e=_e(e);var n=B(t,e),r=He(t,e,!0);if(r)throw new R(r);if(!t.La.vb)throw new R(63);if(n.ib)throw new R(10);t.La.vb(t,e),Re(n)}function tt(e){var t=z(e,{parent:!0}).node;if(!t)throw new R(44);e=_e(e);var n=B(t,e),r=He(t,e,!1);if(r)throw new R(r);if(!t.La.xb)throw new R(63);if(n.ib)throw new R(10);t.La.xb(t,e),Re(n)}function G(e,t){return e=z(e,{hb:!t}).node,Ue(e.La.Wa)(e)}function nt(e,t,n,r){Ke(e,t,{mode:n&4095|t.mode&-4096,Ta:Date.now(),dc:r})}function rt(e,t){e=typeof e==`string`?z(e,{hb:!0}).node:e,nt(null,e,t)}function it(e,t,n){if(V(t.mode))throw new R(31);if((t.mode&61440)!=32768)throw new R(28);var r=H(t,`w`);if(r)throw new R(r);Ke(e,t,{size:n,timestamp:Date.now()})}function K(e,t,n=438){if(e===``)throw new R(44);if(typeof t==`string`){var r={r:0,"r+":2,w:577,"w+":578,a:1089,"a+":1090}[t];if(r===void 0)throw Error(`Unknown file open mode: ${t}`);t=r}if(n=t&64?n&4095|32768:0,typeof e==`object`)r=e;else{var i=e.endsWith(`/`);e=z(e,{hb:!(t&131072),sc:!0}),r=e.node,e=e.path}var a=!1;if(t&64){if(r){if(t&128)throw new R(20)}else{if(i)throw new R(31);r=Xe(e,n|511,0),a=!0}}if(!r)throw new R(44);if((r.mode&61440)==8192&&(t&=-513),t&65536&&!V(r.mode))throw new R(54);if(!a&&(i=r?(r.mode&61440)==40960?32:V(r.mode)&&(Be(t)!==`r`||t&576)?31:H(r,Be(t)):44))throw new R(i);return t&512&&!a&&(i=r,i=typeof i==`string`?z(i,{hb:!0}).node:i,it(null,i,0)),t&=-131713,i=We({node:r,path:Ie(r),flags:t,seekable:!0,position:0,Ma:r.Ma,uc:[],error:!1}),i.Ma.open&&i.Ma.open(i),a&&rt(r,n&511),!o.logReadFiles||t&1||e in Ne||(Ne[e]=1),i}function at(e){if(e.bb===null)throw new R(8);e.Eb&&=null;try{e.Ma.close&&e.Ma.close(e)}catch(e){throw e}finally{I[e.bb]=null}e.bb=null}function ot(e,t,n){if(e.bb===null)throw new R(8);if(!e.seekable||!e.Ma.Ya)throw new R(70);if(n!=0&&n!=1&&n!=2)throw new R(28);e.position=e.Ma.Ya(e,t,n),e.uc=[]}function st(e,t,n,r,i){if(0>r||0>i)throw new R(28);if(e.bb===null||(e.flags&2097155)==1)throw new R(8);if(V(e.node.mode))throw new R(31);if(!e.Ma.read)throw new R(28);var a=i!==void 0;if(!a)i=e.position;else if(!e.seekable)throw new R(70);return t=e.Ma.read(e,t,n,r,i),a||(e.position+=t),t}function ct(e,t,n,r,i){if(0>r||0>i)throw new R(28);if(e.bb===null||!(e.flags&2097155))throw new R(8);if(V(e.node.mode))throw new R(31);if(!e.Ma.write)throw new R(28);e.seekable&&e.flags&1024&&ot(e,0,2);var a=i!==void 0;if(!a)i=e.position;else if(!e.seekable)throw new R(70);return t=e.Ma.write(e,t,n,r,i,void 0),a||(e.position+=t),t}function lt(e){var t=t||0,n=`binary`;n!==`utf8`&&n!==`binary`&&w(`Invalid encoding type "${n}"`),t=K(e,t),e=G(e).size;var r=new Uint8Array(e);return st(t,r,0,e,0),n===`utf8`&&(r=M(r)),at(t),r}function q(e,t,n){e=he(`/dev/`+e);var r=De(!!t,!!n);q.Rb??=64;var i=q.Rb++<<8|0;Je(i,{open(e){e.seekable=!1},close(){n?.buffer?.length&&n(10)},read(e,n,r,i){for(var a=0,o=0;o<i;o++){try{var s=t()}catch{throw new R(29)}if(s===void 0&&a===0)throw new R(6);if(s==null)break;a++,n[r+o]=s}return a&&(e.node.$a=Date.now()),a},write(e,t,r,i){for(var a=0;a<i;a++)try{n(t[r+a])}catch{throw new R(29)}return i&&(e.node.Ua=e.node.Ta=Date.now()),a}}),Qe(e,r,i)}var J={};function Y(e,t,n){if(t.charAt(0)===`/`)return t;if(e=e===-100?`/`:U(e).path,t.length==0){if(!n)throw new R(44);return e}return e+`/`+t}function ut(e,t){x[e>>2]=t.cc,x[e+4>>2]=t.mode,x[e+8>>2]=t.rc,x[e+12>>2]=t.uid,x[e+16>>2]=t.nc,x[e+20>>2]=t.nb,C[e+24>>3]=BigInt(t.size),b[e+32>>2]=4096,b[e+36>>2]=t.$b;var n=t.$a.getTime(),r=t.Ua.getTime(),i=t.Ta.getTime();return C[e+40>>3]=BigInt(Math.floor(n/1e3)),x[e+48>>2]=n%1e3*1e6,C[e+56>>3]=BigInt(Math.floor(r/1e3)),x[e+64>>2]=r%1e3*1e6,C[e+72>>3]=BigInt(Math.floor(i/1e3)),x[e+80>>2]=i%1e3*1e6,C[e+88>>3]=BigInt(t.oc),0}var dt=void 0,ft=()=>{var e=b[dt>>2];return dt+=4,e},pt=0,mt=[0,31,60,91,121,152,182,213,244,274,305,335],ht=[0,31,59,90,120,151,181,212,243,273,304,334],gt={},_t=e=>{if(!(e instanceof se||e==`unwind`))throw e},vt=e=>{throw te=e,ue||0<pt||(o.onExit?.(e),g=!0),new se(e)},yt=e=>{if(!g)try{e()}catch(e){_t(e)}finally{if(!(ue||0<pt))try{te=e=te,vt(e)}catch(e){_t(e)}}},bt={},xt=()=>{if(!St){var e={USER:`web_user`,LOGNAME:`web_user`,PATH:`/`,PWD:`/`,HOME:`/home/web_user`,LANG:(globalThis.navigator?.language??`C`).replace(`-`,`_`)+`.UTF-8`,_:l||`./this.program`},t;for(t in bt)bt[t]===void 0?delete e[t]:e[t]=bt[t];var n=[];for(t in e)n.push(`${t}=${e[t]}`);St=n}return St},St,Ct=(e,t,n,r)=>{var i={string:e=>{var t=0;if(e!=null&&e!==0){t=N(e)+1;var n=Q(t);P(e,v,n,t),t=n}return t},array:e=>{var t=Q(e.length);return _.set(e,t),t}};e=o[`_`+e];var a=[],s=0;if(r)for(var c=0;c<r.length;c++){var l=i[n[c]];l?(s===0&&(s=Ft()),a[c]=l(r[c])):a[c]=r[c]}return n=e(...a),n=function(e){return s!==0&&Pt(s),t===`string`?j(e):t===`boolean`?!!e:e}(n)},wt=e=>{var t=N(e)+1,n=At(t);return n&&P(e,v,n,t),n},X,Tt=[],Z=e=>{X.delete($.get(e)),$.set(e,null),Tt.push(e)},Et=e=>{let t=e.length;return[t%128|128,t>>7,...e]},Dt={i:127,p:127,j:126,f:125,d:124,e:111},Ot=e=>Et(Array.from(e,e=>Dt[e])),kt=(e,t)=>{if(!X){X=new WeakMap;var n=$.length;if(X)for(var r=0;r<0+n;r++){var i=$.get(r);i&&X.set(i,r)}}if(n=X.get(e)||0)return n;n=Tt.length?Tt.pop():$.grow(1);try{$.set(n,e)}catch(r){if(!(r instanceof TypeError))throw r;t=Uint8Array.of(0,97,115,109,1,0,0,0,1,...Et([1,96,...Ot(t.slice(1)),...Ot(t[0]===`v`?``:t[0])]),2,7,1,1,101,1,102,0,0,7,5,1,1,102,0,0),t=new WebAssembly.Module(t),t=new WebAssembly.Instance(t,{e:{f:e}}).exports.f,$.set(n,t)}return X.set(e,n),n};if(L=Array(4096),Ye(F,`/`),W(`/tmp`),W(`/home`),W(`/home/web_user`),(function(){W(`/dev`),Je(259,{read:()=>0,write:(e,t,n,r)=>r,Ya:()=>0}),Qe(`/dev/null`,259),Ce(1280,Te),Ce(1536,Ee),Qe(`/dev/tty`,1280),Qe(`/dev/tty1`,1536);var e=new Uint8Array(1024),t=0,n=()=>(t===0&&(ye(e),t=e.byteLength),e[--t]);q(`random`,n),q(`urandom`,n),W(`/dev/shm`),W(`/dev/shm/tmp`)})(),(function(){W(`/proc`);var e=W(`/proc/self`);W(`/proc/self/fd`),Ye({ab(){var t=ze(e,`fd`,16895,73);return t.Ma={Ya:F.Ma.Ya},t.La={mb(e,t){e=+t;var n=U(e);return e={parent:null,ab:{Sb:`fake`},La:{eb:()=>n.path},id:e+1},e.parent=e},Ib(){return Array.from(I.entries()).filter(([,e])=>e).map(([e])=>e.toString())}},t}},`/proc/self/fd`)})(),o.noExitRuntime&&(ue=o.noExitRuntime),o.print&&(ee=o.print),o.printErr&&(m=o.printErr),o.wasmBinary&&(h=o.wasmBinary),o.thisProgram&&(l=o.thisProgram),o.preInit)for(typeof o.preInit==`function`&&(o.preInit=[o.preInit]);0<o.preInit.length;)o.preInit.shift()();o.stackSave=()=>Ft(),o.stackRestore=e=>Pt(e),o.stackAlloc=e=>Q(e),o.cwrap=(e,t,n,r)=>{var i=!n||n.every(e=>e===`number`||e===`boolean`);return t!==`string`&&i&&!r?o[`_`+e]:(...r)=>Ct(e,t,n,r)},o.addFunction=kt,o.removeFunction=Z,o.UTF8ToString=j,o.stringToNewUTF8=wt,o.writeArrayToMemory=(e,t)=>{_.set(e,t)};var At,jt,Mt,Nt,Pt,Q,Ft,It,$,Lt={a:(e,t,n,r)=>w(`Assertion failed: ${j(e)}, at: `+[t?j(t):`unknown filename`,n,r?j(r):`unknown function`]),i:function(e,t){try{return e=j(e),rt(e,t),0}catch(e){if(J===void 0||e.name!==`ErrnoError`)throw e;return-e.Pa}},L:function(e,t,n){try{if(t=j(t),t=Y(e,t),n&-8)return-28;var r=z(t,{hb:!0}).node;return r?(e=``,n&4&&(e+=`r`),n&2&&(e+=`w`),n&1&&(e+=`x`),e&&H(r,e)?-2:0):-44}catch(e){if(J===void 0||e.name!==`ErrnoError`)throw e;return-e.Pa}},j:function(e,t){try{var n=U(e);return nt(n,n.node,t,!1),0}catch(e){if(J===void 0||e.name!==`ErrnoError`)throw e;return-e.Pa}},h:function(e){try{var t=U(e);return Ke(t,t.node,{timestamp:Date.now(),dc:!1}),0}catch(e){if(J===void 0||e.name!==`ErrnoError`)throw e;return-e.Pa}},b:function(e,t,n){dt=n;try{var r=U(e);switch(t){case 0:var i=ft();if(0>i)break;for(;I[i];)i++;return Ge(r,i).bb;case 1:case 2:return 0;case 3:return r.flags;case 4:return i=ft(),r.flags|=i,0;case 12:return i=ft(),y[i+0>>1]=2,0;case 13:case 14:return 0}return-28}catch(e){if(J===void 0||e.name!==`ErrnoError`)throw e;return-e.Pa}},g:function(e,t){try{var n=U(e),r=n.node,i=n.Ma.Wa;return e=i?n:r,i??=r.La.Wa,Ue(i),ut(t,i(e))}catch(e){if(J===void 0||e.name!==`ErrnoError`)throw e;return-e.Pa}},H:function(e,t){t=-9007199254740992>t||9007199254740992<t?NaN:Number(t);try{if(isNaN(t))return-61;var n=U(e);if(0>t||!(n.flags&2097155))throw new R(28);return it(n,n.node,t),0}catch(e){if(J===void 0||e.name!==`ErrnoError`)throw e;return-e.Pa}},G:function(e,t){try{if(t===0)return-28;var n=N(`/`)+1;return t<n?-68:(P(`/`,v,e,t),n)}catch(e){if(J===void 0||e.name!==`ErrnoError`)throw e;return-e.Pa}},K:function(e,t){try{return e=j(e),ut(t,G(e,!0))}catch(e){if(J===void 0||e.name!==`ErrnoError`)throw e;return-e.Pa}},C:function(e,t,n){try{return t=j(t),t=Y(e,t),W(t,n),0}catch(e){if(J===void 0||e.name!==`ErrnoError`)throw e;return-e.Pa}},J:function(e,t,n,r){try{t=j(t);var i=r&256;return t=Y(e,t,r&4096),ut(n,i?G(t,!0):G(t))}catch(e){if(J===void 0||e.name!==`ErrnoError`)throw e;return-e.Pa}},x:function(e,t,n,r){dt=r;try{t=j(t),t=Y(e,t);var i=r?ft():0;return K(t,n,i).bb}catch(e){if(J===void 0||e.name!==`ErrnoError`)throw e;return-e.Pa}},v:function(e,t,n,r){try{if(t=j(t),t=Y(e,t),0>=r)return-28;var i=z(t).node;if(!i)throw new R(44);if(!i.La.eb)throw new R(28);var a=i.La.eb(i),o=Math.min(r,N(a)),s=_[n+o];return P(a,v,n,r+1),_[n+o]=s,o}catch(e){if(J===void 0||e.name!==`ErrnoError`)throw e;return-e.Pa}},u:function(e){try{return e=j(e),et(e),0}catch(e){if(J===void 0||e.name!==`ErrnoError`)throw e;return-e.Pa}},f:function(e,t){try{return e=j(e),ut(t,G(e))}catch(e){if(J===void 0||e.name!==`ErrnoError`)throw e;return-e.Pa}},r:function(e,t,n){try{if(t=j(t),t=Y(e,t),n){if(n===512)et(t);else return-28}else tt(t);return 0}catch(e){if(J===void 0||e.name!==`ErrnoError`)throw e;return-e.Pa}},q:function(e,t,n){try{t=j(t),t=Y(e,t,!0);var r=Date.now(),i,a;if(n){var o=x[n>>2]+4294967296*b[n+4>>2],s=b[n+8>>2];i=s==1073741823?r:s==1073741822?null:1e3*o+s/1e6,n+=16,o=x[n>>2]+4294967296*b[n+4>>2],s=b[n+8>>2],a=s==1073741823?r:s==1073741822?null:1e3*o+s/1e6}else a=i=r;if((a??i)!==null){e=i;var c=z(t,{hb:!0}).node;Ue(c.La.Xa)(c,{$a:e,Ua:a})}return 0}catch(e){if(J===void 0||e.name!==`ErrnoError`)throw e;return-e.Pa}},m:()=>w(``),l:()=>{ue=!1,pt=0},A:function(e,t){e=-9007199254740992>e||9007199254740992<e?NaN:Number(e),e=new Date(1e3*e),b[t>>2]=e.getSeconds(),b[t+4>>2]=e.getMinutes(),b[t+8>>2]=e.getHours(),b[t+12>>2]=e.getDate(),b[t+16>>2]=e.getMonth(),b[t+20>>2]=e.getFullYear()-1900,b[t+24>>2]=e.getDay();var n=e.getFullYear();b[t+28>>2]=(n%4!=0||n%100==0&&n%400!=0?ht:mt)[e.getMonth()]+e.getDate()-1|0,b[t+36>>2]=-(60*e.getTimezoneOffset()),n=new Date(e.getFullYear(),6,1).getTimezoneOffset();var r=new Date(e.getFullYear(),0,1).getTimezoneOffset();b[t+32>>2]=(n!=r&&e.getTimezoneOffset()==Math.min(r,n))|0},y:function(e,t,n,r,i,a,o){i=-9007199254740992>i||9007199254740992<i?NaN:Number(i);try{var s=U(r);if(t&2&&!(n&2)&&(s.flags&2097155)!=2||(s.flags&2097155)==1)throw new R(2);if(!s.Ma.sb)throw new R(43);if(!e)throw new R(28);var c=s.Ma.sb(s,e,i,t,n),l=c.tc;return b[a>>2]=c.Ub,x[o>>2]=l,0}catch(e){if(J===void 0||e.name!==`ErrnoError`)throw e;return-e.Pa}},z:function(e,t,n,r,i,a){a=-9007199254740992>a||9007199254740992<a?NaN:Number(a);try{var o=U(i);if(n&2){if((o.node.mode&61440)!=32768)throw new R(43);r&2||o.Ma.tb&&o.Ma.tb(o,v.slice(e,e+t),a,t,r)}}catch(e){if(J===void 0||e.name!==`ErrnoError`)throw e;return-e.Pa}},n:(e,t)=>(gt[e]&&(clearTimeout(gt[e].id),delete gt[e]),t&&(gt[e]={id:setTimeout(()=>{delete gt[e],yt(()=>Nt(e,performance.now()))},t),Hc:t}),0),B:(e,t,n,r)=>{var i=new Date().getFullYear(),a=new Date(i,0,1).getTimezoneOffset();i=new Date(i,6,1).getTimezoneOffset(),x[e>>2]=60*Math.max(a,i),b[t>>2]=Number(a!=i),t=e=>{var t=Math.abs(e);return`UTC${0<=e?`-`:`+`}${String(Math.floor(t/60)).padStart(2,`0`)}${String(t%60).padStart(2,`0`)}`},e=t(a),t=t(i),i<a?(P(e,v,n,17),P(t,v,r,17)):(P(e,v,r,17),P(t,v,n,17))},d:()=>Date.now(),s:()=>2147483648,c:()=>performance.now(),o:e=>{var t=v.length;if(e>>>=0,2147483648<e)return!1;for(var n=1;4>=n;n*=2){var r=t*(1+.2/n);r=Math.min(r,e+100663296);a:{r=(Math.min(2147483648,65536*Math.ceil(Math.max(e,r)/65536))-It.buffer.byteLength+65535)/65536|0;try{It.grow(r),re();var i=1;break a}catch{}i=void 0}if(i)return!0}return!1},E:(e,t)=>{var n=0,r=0,i;for(i of xt()){var a=t+n;x[e+r>>2]=a,n+=P(i,v,a,1/0)+1,r+=4}return 0},F:(e,t)=>{var n=xt();x[e>>2]=n.length,e=0;for(var r of n)e+=N(r)+1;return x[t>>2]=e,0},e:function(e){try{return at(U(e)),0}catch(e){if(J===void 0||e.name!==`ErrnoError`)throw e;return e.Pa}},p:function(e,t){try{var n=U(e);return _[t]=n.Va?2:V(n.mode)?3:(n.mode&61440)==40960?7:4,y[t+2>>1]=0,C[t+8>>3]=BigInt(0),C[t+16>>3]=BigInt(0),0}catch(e){if(J===void 0||e.name!==`ErrnoError`)throw e;return e.Pa}},w:function(e,t,n,r){try{a:{var i=U(e);e=t;for(var a,o=t=0;o<n;o++){var s=x[e>>2],c=x[e+4>>2];e+=8;var l=st(i,_,s,c,a);if(0>l){var u=-1;break a}if(t+=l,l<c)break;a!==void 0&&(a+=l)}u=t}return x[r>>2]=u,0}catch(e){if(J===void 0||e.name!==`ErrnoError`)throw e;return e.Pa}},D:function(e,t,n,r){t=-9007199254740992>t||9007199254740992<t?NaN:Number(t);try{if(isNaN(t))return 61;var i=U(e);return ot(i,t,n),C[r>>3]=BigInt(i.position),i.Eb&&t===0&&n===0&&(i.Eb=null),0}catch(e){if(J===void 0||e.name!==`ErrnoError`)throw e;return e.Pa}},I:function(e){try{var t=U(e);return t.Ma?.lb?.(t)}catch(e){if(J===void 0||e.name!==`ErrnoError`)throw e;return e.Pa}},t:function(e,t,n,r){try{a:{var i=U(e);e=t;for(var a,o=t=0;o<n;o++){var s=x[e>>2],c=x[e+4>>2];e+=8;var l=ct(i,_,s,c,a);if(0>l){var u=-1;break a}if(t+=l,l<c)break;a!==void 0&&(a+=l)}u=t}return x[r>>2]=u,0}catch(e){if(J===void 0||e.name!==`ErrnoError`)throw e;return e.Pa}},k:vt};function Rt(){function e(){if(o.calledRun=!0,!g){if(!o.noFSInit&&!je){var e,t;je=!0,e??=o.stdin,t??=o.stdout,n??=o.stderr,e?q(`stdin`,e):$e(`/dev/tty`,`/dev/stdin`),t?q(`stdout`,null,t):$e(`/dev/tty`,`/dev/stdout`),n?q(`stderr`,null,n):$e(`/dev/tty1`,`/dev/stderr`),K(`/dev/stdin`,0),K(`/dev/stdout`,1),K(`/dev/stderr`,1)}if(zt.N(),Me=!1,o.onRuntimeInitialized?.(),o.postRun)for(typeof o.postRun==`function`&&(o.postRun=[o.postRun]);o.postRun.length;){var n=o.postRun.shift();D.push(n)}E(D)}}if(0<O)k=Rt;else{if(o.preRun)for(typeof o.preRun==`function`&&(o.preRun=[o.preRun]);o.preRun.length;)le();E(ce),0<O?k=Rt:o.setStatus?(o.setStatus(`Running...`),setTimeout(()=>{setTimeout(()=>o.setStatus(``),1),e()},1)):e()}}var zt;return(async function(){function e(e){return e=zt=e.exports,o._sqlite3_free=e.P,o._sqlite3_value_text=e.Q,o._sqlite3_prepare_v2=e.R,o._sqlite3_step=e.S,o._sqlite3_reset=e.T,o._sqlite3_exec=e.U,o._sqlite3_finalize=e.V,o._sqlite3_column_name=e.W,o._sqlite3_column_text=e.X,o._sqlite3_column_type=e.Y,o._sqlite3_errmsg=e.Z,o._sqlite3_clear_bindings=e._,o._sqlite3_value_blob=e.$,o._sqlite3_value_bytes=e.aa,o._sqlite3_value_double=e.ba,o._sqlite3_value_int=e.ca,o._sqlite3_value_type=e.da,o._sqlite3_result_blob=e.ea,o._sqlite3_result_double=e.fa,o._sqlite3_result_error=e.ga,o._sqlite3_result_int=e.ha,o._sqlite3_result_int64=e.ia,o._sqlite3_result_null=e.ja,o._sqlite3_result_text=e.ka,o._sqlite3_aggregate_context=e.la,o._sqlite3_column_count=e.ma,o._sqlite3_data_count=e.na,o._sqlite3_column_blob=e.oa,o._sqlite3_column_bytes=e.pa,o._sqlite3_column_double=e.qa,o._sqlite3_bind_blob=e.ra,o._sqlite3_bind_double=e.sa,o._sqlite3_bind_int=e.ta,o._sqlite3_bind_text=e.ua,o._sqlite3_bind_parameter_index=e.va,o._sqlite3_sql=e.wa,o._sqlite3_normalized_sql=e.xa,o._sqlite3_changes=e.ya,o._sqlite3_close_v2=e.za,o._sqlite3_create_function_v2=e.Aa,o._sqlite3_update_hook=e.Ba,o._sqlite3_open=e.Ca,At=o._malloc=e.Da,jt=o._free=e.Ea,o._RegisterExtensionFunctions=e.Fa,Mt=e.Ga,Nt=e.Ha,Pt=e.Ia,Q=e.Ja,Ft=e.Ka,It=e.M,$=e.O,re(),O--,o.monitorRunDependencies?.(O),O==0&&k&&(e=k,k=null,e()),zt}O++,o.monitorRunDependencies?.(O);var t={a:Lt};return o.instantiateWasm?new Promise(n=>{o.instantiateWasm(t,(t,r)=>{n(e(t,r))})}):(T??=o.locateFile?o.locateFile(`sql-wasm-browser.wasm`,d):d+`sql-wasm-browser.wasm`,e((await oe(t)).instance))})(),Rt(),i}),n)};typeof e==`object`&&typeof t==`object`?(t.exports=r,t.exports.default=r):typeof define==`function`&&define.amd?define([],function(){return r}):typeof e==`object`&&(e.Module=r)}))(),1),a=`/study-hub/assets/sql-wasm-DfANybxk.wasm`,o=`-- =====================================================================
-- Smart Semester Study Management System — database schema
-- =====================================================================
-- Written in plain SQL that is 95% PostgreSQL compatible.
-- When moving to PostgreSQL, change only:
--   INTEGER PRIMARY KEY AUTOINCREMENT  ->  SERIAL PRIMARY KEY
--   TEXT (timestamps)                  ->  TIMESTAMPTZ
--   INTEGER 0/1 (boolean)              ->  BOOLEAN
-- =====================================================================

-- ---------------------------------------------------------------------
-- User
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------
-- Subject -> Chapter -> Topic  (the study hierarchy)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subjects (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT    NOT NULL,              -- English / book name
  name_bn    TEXT,                          -- Bangla name (optional)
  code       TEXT,                          -- e.g. 28561
  color      TEXT    NOT NULL DEFAULT '#2563eb',
  icon       TEXT    NOT NULL DEFAULT 'book',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,   -- soft delete
  created_at TEXT    NOT NULL,
  updated_at TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_subjects_user ON subjects(user_id, order_index);

CREATE TABLE IF NOT EXISTS chapters (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  number     INTEGER NOT NULL DEFAULT 1,
  name       TEXT    NOT NULL,
  name_bn    TEXT,
  notes      TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL,
  updated_at TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_chapters_subject ON chapters(subject_id, order_index);

CREATE TABLE IF NOT EXISTS topics (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  chapter_id    INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  name          TEXT    NOT NULL,
  name_bn       TEXT,
  description   TEXT,
  importance    TEXT    NOT NULL DEFAULT 'medium'   -- low | medium | high
                CHECK (importance IN ('low','medium','high')),
  -- progress -----------------------------------------------------------
  status        TEXT    NOT NULL DEFAULT 'not_started'
                CHECK (status IN ('not_started','studying','completed','needs_revision')),
  confidence    INTEGER CHECK (confidence IS NULL OR (confidence BETWEEN 1 AND 5)),
  -- revision -----------------------------------------------------------
  revision_stage     TEXT NOT NULL DEFAULT 'none'
                     CHECK (revision_stage IN ('none','learned','revision_1','revision_2','final')),
  revision_count     INTEGER NOT NULL DEFAULT 0,
  last_revision_at   TEXT,
  next_revision_at   TEXT,
  -- dates --------------------------------------------------------------
  started_at     TEXT,
  completed_at   TEXT,
  last_studied_at TEXT,
  order_index    INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT    NOT NULL,
  updated_at     TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_topics_chapter ON topics(chapter_id, order_index);
CREATE INDEX IF NOT EXISTS idx_topics_status ON topics(status);

-- Study material attached to a topic (link, PDF path, pasted text...)
CREATE TABLE IF NOT EXISTS study_materials (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id   INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title      TEXT    NOT NULL,
  kind       TEXT    NOT NULL DEFAULT 'link',  -- link | file | text
  url_or_path TEXT,
  content    TEXT,
  created_at TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_materials_topic ON study_materials(topic_id);

-- ---------------------------------------------------------------------
-- Notes  (personal note and AI note are kept separate via \`source\`)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id   INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source     TEXT    NOT NULL DEFAULT 'personal' CHECK (source IN ('personal','ai')),
  title      TEXT,
  body       TEXT    NOT NULL,
  created_at TEXT    NOT NULL,
  updated_at TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notes_topic ON notes(topic_id);

-- ---------------------------------------------------------------------
-- AI generated content (Phase 4) + illustrations (Phase 5)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_contents (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id   INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT    NOT NULL,   -- easy_explain | detail | short_note | exam_note | mcq | summary ...
  language   TEXT    NOT NULL DEFAULT 'bn',
  title      TEXT,
  body       TEXT    NOT NULL,
  model      TEXT,
  created_at TEXT    NOT NULL,
  updated_at TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ai_contents_topic ON ai_contents(topic_id, kind);

CREATE TABLE IF NOT EXISTS generated_images (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id   INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt     TEXT    NOT NULL,
  caption    TEXT,
  file_path  TEXT    NOT NULL,
  model      TEXT,
  created_at TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_images_topic ON generated_images(topic_id);

-- ---------------------------------------------------------------------
-- Study sessions (Phase 2)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS study_sessions (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id       INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  chapter_id       INTEGER REFERENCES chapters(id) ON DELETE SET NULL,
  topic_id         INTEGER REFERENCES topics(id) ON DELETE SET NULL,
  started_at       TEXT    NOT NULL,
  ended_at         TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  confidence       INTEGER CHECK (confidence IS NULL OR (confidence BETWEEN 1 AND 5)),
  revision_needed  INTEGER NOT NULL DEFAULT 0,
  topics_completed INTEGER NOT NULL DEFAULT 0,
  note             TEXT,
  created_at       TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON study_sessions(user_id, started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_subject ON study_sessions(subject_id);

-- ---------------------------------------------------------------------
-- Revision log (Phase 2)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS revisions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id     INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stage        TEXT    NOT NULL CHECK (stage IN ('learned','revision_1','revision_2','final')),
  due_at       TEXT,
  completed_at TEXT,
  note         TEXT,
  created_at   TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_revisions_topic ON revisions(topic_id);
CREATE INDEX IF NOT EXISTS idx_revisions_due ON revisions(completed_at, due_at);

-- ---------------------------------------------------------------------
-- Quiz (Phase 3)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quizzes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT    NOT NULL,
  created_by TEXT    NOT NULL DEFAULT 'user',   -- user | ai
  created_at TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_quizzes_chapter ON quizzes(chapter_id);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id        INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  topic_id       INTEGER REFERENCES topics(id) ON DELETE SET NULL,
  type           TEXT    NOT NULL CHECK (type IN ('mcq','true_false','short','viva')),
  question       TEXT    NOT NULL,
  options_json   TEXT,
  correct_answer TEXT,
  explanation    TEXT,
  order_index    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_questions_quiz ON quiz_questions(quiz_id, order_index);

CREATE TABLE IF NOT EXISTS quiz_results (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id          INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score            REAL    NOT NULL DEFAULT 0,
  total            REAL    NOT NULL DEFAULT 0,
  accuracy         REAL    NOT NULL DEFAULT 0,
  weak_topics_json TEXT,
  taken_at         TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_results_quiz ON quiz_results(quiz_id, taken_at);

-- ---------------------------------------------------------------------
-- Today's study plan (Dashboard) — auto generated, user editable
-- ---------------------------------------------------------------------
-- One row per answered question. Storing the answers (not just the total score)
-- is what makes "weak topic" a measured fact instead of a guess.
CREATE TABLE IF NOT EXISTS quiz_answers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  result_id   INTEGER NOT NULL REFERENCES quiz_results(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES quiz_questions(id) ON DELETE SET NULL,
  topic_id    INTEGER REFERENCES topics(id) ON DELETE SET NULL,
  answer      TEXT,
  is_correct  INTEGER NOT NULL DEFAULT 0,
  awarded     REAL    NOT NULL DEFAULT 0,
  max_points  REAL    NOT NULL DEFAULT 1,
  self_graded INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_quiz_answers_result ON quiz_answers(result_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_topic  ON quiz_answers(topic_id);

CREATE TABLE IF NOT EXISTS study_plan_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_date  TEXT    NOT NULL,                    -- YYYY-MM-DD (local, Asia/Dhaka)
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
  topic_id   INTEGER REFERENCES topics(id) ON DELETE CASCADE,
  kind       TEXT    NOT NULL DEFAULT 'study' CHECK (kind IN ('study','revision')),
  title      TEXT    NOT NULL,
  is_done    INTEGER NOT NULL DEFAULT 0,
  source     TEXT    NOT NULL DEFAULT 'auto' CHECK (source IN ('auto','user')),
  created_at TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_plan_user_date ON study_plan_items(user_id, plan_date);

-- ---------------------------------------------------------------------
-- Activity log (feeds "Recent Activity" on the dashboard)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activities (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT    NOT NULL,   -- subject_created | topic_status_changed | note_added | ...
  subject_id INTEGER,
  chapter_id INTEGER,
  topic_id   INTEGER,
  message    TEXT    NOT NULL,
  meta_json  TEXT,
  created_at TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id, created_at);

-- ---------------------------------------------------------------------
-- App metadata (schema version for future migrations)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- ---------------------------------------------------------------------
-- Exam Mode (Phase 5): a timed exam built only from the chosen
-- subject → chapter → topic, graded automatically
-- ---------------------------------------------------------------------
-- questions_json holds a snapshot of the questions *with* their correct
-- answers, so the exam keeps working (and stays gradable) even if the quiz
-- bank is edited or deleted later. The snapshot is never sent to the client
-- before the exam is submitted.
CREATE TABLE IF NOT EXISTS exams (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id         INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  chapter_id         INTEGER REFERENCES chapters(id) ON DELETE SET NULL,
  topic_id           INTEGER REFERENCES topics(id) ON DELETE SET NULL,
  scope_label        TEXT    NOT NULL,          -- "Subject → Chapter → Topic" as shown in the UI
  title              TEXT    NOT NULL,
  question_count     INTEGER NOT NULL,
  duration_minutes   INTEGER NOT NULL,
  status             TEXT    NOT NULL DEFAULT 'in_progress'
                     CHECK (status IN ('in_progress','submitted')),
  questions_json     TEXT    NOT NULL,
  answers_json       TEXT,
  started_at         TEXT    NOT NULL,
  submitted_at       TEXT,
  total              INTEGER NOT NULL DEFAULT 0,
  correct            INTEGER NOT NULL DEFAULT 0,
  wrong              INTEGER NOT NULL DEFAULT 0,
  unanswered         INTEGER NOT NULL DEFAULT 0,
  score              REAL    NOT NULL DEFAULT 0,
  percentage         REAL    NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER,
  weak_topic_ids_json TEXT,
  created_at         TEXT    NOT NULL,
  updated_at         TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_exams_user ON exams(user_id, started_at);

-- ---------------------------------------------------------------------
-- Auto backup (Phase 5): rolling snapshots of everything the student owns
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS backups (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind        TEXT    NOT NULL DEFAULT 'auto' CHECK (kind IN ('auto','manual')),
  label       TEXT    NOT NULL,
  size_bytes  INTEGER NOT NULL DEFAULT 0,
  payload     TEXT    NOT NULL,          -- the same JSON the Settings download produces
  created_at  TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_backups_user ON backups(user_id, created_at);
`;function s(){return o}var c=`study-hub`,l=`kv`;function u(e){return new Promise((t,n)=>{let r=e.open(c,1);r.onupgradeneeded=()=>{let e=r.result;e.objectStoreNames.contains(l)||e.createObjectStore(l)},r.onsuccess=()=>t(r.result),r.onerror=()=>n(r.error)})}typeof window<`u`&&(window.addEventListener(`pagehide`,()=>{for(let e of d)e()}),document.addEventListener(`visibilitychange`,()=>{if(document.visibilityState===`hidden`)for(let e of d)e()}));var d=new Set;function f(e){return d.add(e),()=>d.delete(e)}async function p(e=globalThis.indexedDB){if(!e){console.warn(`[storage] IndexedDB unavailable — data will only live in memory for this session`);let e=new Map;return{persistent:!1,get:async t=>e.get(t)??null,set:async(t,n)=>e.set(t,n),remove:async t=>e.delete(t)}}let t=await u(e),n=(e,n)=>new Promise((r,i)=>{let a=n(t.transaction(l,e).objectStore(l));a.onsuccess=()=>r(a.result),a.onerror=()=>i(a.error)});return{persistent:!0,get:e=>n(`readonly`,t=>t.get(e)),set:(e,t)=>n(`readwrite`,n=>n.put(t,e)),remove:e=>n(`readwrite`,t=>t.delete(e)),keys:()=>n(`readonly`,e=>e.getAllKeys())}}function ee(e){let t=[],n=``,r=0,i=t=>{for(n+=t,r+=1;r<e.length;){if(e[r]===t&&e[r+1]===t){n+=t+t,r+=2;continue}if(e[r]===t){n+=t,r+=1;break}n+=e[r],r+=1}};for(;r<e.length;){let a=e[r];if(a===`'`||a===`"`){i(a);continue}if(a===`-`&&e[r+1]===`-`){for(;r<e.length&&e[r]!==`
`;)n+=e[r++];continue}if(a===`/`&&e[r+1]===`*`){for(;r<e.length&&(e[r]!==`*`||e[r+1]!==`/`);)n+=e[r++];n+=`*/`,r+=2;continue}if((a===`@`||a===`:`||a===`$`)&&/[A-Za-z_]/.test(e[r+1]??``)){let i=r+1;for(;i<e.length&&/[A-Za-z0-9_]/.test(e[i]);)i+=1;t.push(e.slice(r+1,i)),n+=`?`,r=i;continue}n+=a,r+=1}return{sql:n,names:t,isNamed:t.length>0}}function m(e,t){if(!e.isNamed)return t.length===1&&Array.isArray(t[0])?t[0]:t;let n=t[0]??{};return e.names.map(e=>{let t=n[e];return t===void 0?null:t})}function h({SQL:e,data:t=null,onPersist:n,persistDelayMs:r=250}){let i=t?new e.Database(new Uint8Array(t)):new e.Database;i.run(`PRAGMA foreign_keys = ON`);let a=new Map,o=!1,s=null,c=e=>{let t=a.get(e);if(t)return t;let n=ee(e);return a.set(e,n),n},l=()=>{o&&(o=!1,s&&=(clearTimeout(s),null),n?.(i.export()))},u=()=>{o=!0,!s&&(s=setTimeout(()=>{s=null,l()},r))},d=()=>i.exec(`SELECT last_insert_rowid()`)?.[0]?.values?.[0]?.[0]??0;function f(e){let t=c(e);return{run(...e){let n=i.prepare(t.sql);try{let r=m(t,e);r.length&&n.bind(r),n.step()}finally{n.free()}let r=i.getRowsModified(),a=d();return r&&u(),{changes:r,lastInsertRowid:a}},get(...e){let n=i.prepare(t.sql);try{let r=m(t,e);return r.length&&n.bind(r),n.step()?n.getAsObject():void 0}finally{n.free()}},all(...e){let n=i.prepare(t.sql),r=[];try{let i=m(t,e);for(i.length&&n.bind(i);n.step();)r.push(n.getAsObject())}finally{n.free()}return r}}}function p(e){i.exec(e),u()}function h(e){return(...t)=>{i.run(`BEGIN`);try{let n=e(...t);return i.run(`COMMIT`),u(),n}catch(e){throw i.run(`ROLLBACK`),e}}}return{prepare:f,exec:p,transaction:h,export:()=>i.export(),replaceWith(t){let n=new e.Database(t);return i.close(),i=n,l(),i.export().length},flush:l,close:()=>i.close()}}var g=null;function te(e){g=e}function _(){if(!g)throw Error(`Browser database is not ready yet — call installLocalApi() from src/browser-db/localApi.js before using the app.`);return g}var v=new Proxy({},{get(e,t){let n=_(),r=n[t];return typeof r==`function`?r.bind(n):r}}),y=class extends Error{constructor(e,t,n){super(t),this.status=e,this.details=n}},b=(e,t)=>new y(400,e,t),x=(e=`Resource not found`)=>new y(404,e),S=e=>(t,n,r)=>Promise.resolve(e(t,n,r)).catch(r);function ne(e,t){let n=t.filter(t=>e?.[t]===void 0||e[t]===null||String(e[t]).trim()===``);if(n.length)throw b(`Missing required field(s): ${n.join(`, `)}`,{missing:n})}function C(e,t=`value`){let n=Number(e);if(!Number.isInteger(n))throw b(`${t} must be an integer`);return n}function re(e){let t=[],n=e.replace(/\/+$/,``).split(`/`).map(e=>e?e.startsWith(`:`)?(t.push(e.slice(1)),`([^/]+)`):e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`):``).join(`/`);return{regex:RegExp(`^${n||``}/?$`),keys:t}}function w(e=``){let t={};for(let[n,r]of new URLSearchParams(e).entries())n in t||(t[n]=r);return t}function T(){let e=[],t=(t,n,r)=>{e.push({kind:`route`,method:t,...re(n),handlers:r})},n={get:(e,...n)=>t(`GET`,e,n),post:(e,...n)=>t(`POST`,e,n),patch:(e,...n)=>t(`PATCH`,e,n),delete:(e,...n)=>t(`DELETE`,e,n),use(t,r){return typeof t==`function`||r===void 0?(e.push({kind:`middleware`,handlers:[t,r].filter(Boolean)}),n):(e.push({kind:`mount`,prefix:t.replace(/\/+$/,``),router:r}),n)},async handle(t,n){let i=t.path===``?`/`:t.path;for(let a of e){if(a.kind===`mount`){if(i!==a.prefix&&!i.startsWith(`${a.prefix}/`))continue;let e=i.slice(a.prefix.length)||`/`;if(await a.router.handle({...t,path:e},n))return!0;continue}if(a.kind===`middleware`){if(await r(a.handlers,t,n),n.finished)return!0;continue}if(a.method!==t.method)continue;let e=a.regex.exec(i);if(!e)continue;let o={...t.params};return a.keys.forEach((t,n)=>{o[t]=decodeURIComponent(e[n+1])}),await r(a.handlers,{...t,params:o},n),!0}return!1}};async function r(e,t,n){let r=-1,i=async a=>{r+=1;let o=e[r];if(!o){if(a)throw a;return}if(a)return o.length===4?o(a,t,n,i):i(a);try{return await o(t,n,i)}catch(e){return i(e)}};return i()}return n}function ie(){return T()}function ae({method:e,path:t,search:n=``,body:r,params:i={},headers:a={}}){return{method:e.toUpperCase(),path:t,params:i,body:r,headers:a,query:w(n),header(e){return a[String(e).toLowerCase()]}}}function oe(){return{statusCode:200,headers:{},body:void 0,finished:!1,status(e){return this.statusCode=e,this},setHeader(e,t){return this.headers[String(e).toLowerCase()]=t,this},json(e){return this.headers[`content-type`]=`application/json; charset=utf-8`,this.body=JSON.stringify(e),this.finished=!0,this},send(e){return this.body=typeof e==`string`?e:JSON.stringify(e),this.finished=!0,this},end(e){return e!==void 0&&(this.body=e),this.finished=!0,this}}}function se(e){let t=e instanceof y?e.status:e?.status??500;return t===500&&typeof console<`u`&&console.error(`[local-api]`,e),{status:t,headers:{"content-type":`application/json; charset=utf-8`},body:JSON.stringify({error:e?.message??`Unexpected server error`,details:e?.details})}}var E={},D={env:E.NODE_ENV??`development`,port:((e,t)=>{let n=Number(e);return Number.isFinite(n)?n:t})(E.PORT,4e3),databaseLabel:`sqlite`,defaultUser:{id:1,name:`Student`,email:`student@local`}},ce={learned:3,revision_1:7,revision_2:14,final:null};async function le({SQL:e,schemaSql:t,data:r=null,storage:i=null,storageKey:a=`database`}){let o=h({SQL:e,data:r,onPersist:i?e=>i.set(a,e):void 0});te(o);let{bootstrapFromSql:s}=await n(async()=>{let{bootstrapFromSql:e}=await import(`./migrate-CjVcMT1A.js`);return{bootstrapFromSql:e}},__vite__mapDeps([0,1])),{seed:c}=await n(async()=>{let{seed:e}=await import(`./seed-BDMTeA82.js`);return{seed:e}},__vite__mapDeps([2,3,1])),{apiRouter:l}=await n(async()=>{let{apiRouter:e}=await import(`./routes-BD27kZRE.js`);return{apiRouter:e}},__vite__mapDeps([4,1,3]));s(t);let u=c({silent:!0});o.flush();let d=T();return d.use(`/api`,l({getUserId:e=>{let t=e.header(`x-user-id`),n=t?Number(t):NaN;return Number.isInteger(n)?n:D.defaultUser.id}})),{handle:async({method:e=`GET`,path:t=`/`,search:n=``,body:r,headers:i={}})=>{let a=oe();try{return await d.handle(ae({method:e,path:t,search:n,body:r,headers:i}),a)?{status:a.statusCode,headers:a.headers,body:a.body}:{status:404,headers:{"content-type":`application/json; charset=utf-8`},body:JSON.stringify({error:`Route not found`})}}catch(e){return se(e)}},database:o,seeded:u,flush:()=>o.flush(),exportBytes:()=>o.export(),replaceDatabase:e=>o.replaceWith(e)}}function O(e,{fetchImpl:t=globalThis.fetch,baseHref:n}={}){let r=t.bind(globalThis),i=n??(typeof location<`u`?location.href:`http://localhost/`);return globalThis.fetch=async(t,n={})=>{let a=typeof t==`string`?t:t?.url??String(t);if(!/\/api(\/|$|\?)/.test(a))return r(t,n);let o=new URL(a,i),s=o.pathname.indexOf(`/api/`),c=s===-1?`/api`:o.pathname.slice(s),l=await e({method:(n.method??`GET`).toUpperCase(),path:c,search:o.search,body:typeof n.body==`string`?JSON.parse(n.body):void 0});return new Response(l.body??null,{status:l.status,headers:l.headers})},()=>{globalThis.fetch=r}}async function k(){let e=await p(),t=await e.get(`database`),o=await(0,i.default)({locateFile:()=>a}),c;try{c=await le({SQL:o,schemaSql:s(),data:t,storage:e})}catch(n){console.error(`[study-hub] database could not be opened`,n),globalThis.__STUDY_HUB_DB_ERROR__=n?.message??String(n),globalThis.__STUDY_HUB_STORAGE__=e,t&&e?.set&&await e.set(`database-broken`,t),await e?.remove?.(`database`),c=await le({SQL:o,schemaSql:s(),data:null,storage:e})}let l=f(()=>c.flush());window.addEventListener(`pagehide`,()=>c.flush());let u=O(c.handle);globalThis.__STUDY_HUB_STORAGE__=e;let{loadRecoveryCopyIndex:d}=await n(async()=>{let{loadRecoveryCopyIndex:e}=await import(`./index-Dih-VwRp.js`).then(e=>e.n);return{loadRecoveryCopyIndex:e}},__vite__mapDeps([5,6]));return await d(e),window.studyHubLocal={backend:c,storage:e,downloadBackup:()=>r(`study-backup.json`,new TextDecoder().decode(c.exportBytes()),`application/json`),stop:()=>{u(),l()}},{...c,storage:e,persistent:e.persistent}}export{b as a,C as c,S as i,k as installLocalApi,v as l,D as n,x as o,ie as r,ne as s,ce as t};