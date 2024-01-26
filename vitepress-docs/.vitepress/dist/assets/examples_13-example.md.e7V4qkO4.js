import{d as de,a1 as re,h as a,j as ue,a2 as ce,o as f,c as b,k as s,a3 as n,a4 as H,a5 as d,a as P,F as A,E as $,I as F,w as X,n as pe,m as Y,P as ve,t as m,b as he,p as me,q as fe,_ as ge}from"./chunks/framework.j-cahziU.js";import{t as be,j as xe,R as _e}from"./chunks/test.YGj_u3gx.js";const l=g=>(me("data-v-bda73729"),g=g(),fe(),g),ye={class:"container"},we={class:"row"},Re={class:"col-sm"},Ce=l(()=>s("legend",null,"Test bench",-1)),ze=l(()=>s("label",{class:"hide",for:"rowHeight"}," Row Height(px) ",-1)),ke=l(()=>s("label",{class:"hide",for:"colNum"}," Max Columns ",-1)),De=l(()=>s("label",{class:"hide",for:"maxRows"}," Max Rows ",-1)),Be=l(()=>s("br",{class:"hide"},null,-1)),Ve=l(()=>s("label",{class:"hide",for:"autosize"}," autosize ",-1)),Ue=l(()=>s("label",{class:"hide",for:"editMode"}," editMode ",-1)),Ee=l(()=>s("label",{class:"hide",for:"horizontalShift"}," horizontalShift ",-1)),Se=l(()=>s("label",{class:"hide",for:"isBounded"}," isBounded ",-1)),Me=l(()=>s("label",{class:"hide",for:"isDraggable"}," isDraggable ",-1)),Ie=l(()=>s("label",{class:"hide",for:"isMirrored"}," isMirrored ",-1)),Le=l(()=>s("label",{class:"hide",for:"isResizable"}," isResizable ",-1)),Ge=l(()=>s("label",{class:"hide",for:"isResponsive"}," isResponsive ",-1)),Ne=l(()=>s("label",{class:"hide",for:"preserveAspectRatio"}," preserveAspectRatio ",-1)),Oe=l(()=>s("label",{class:"hide",for:"preventCollision"}," preventCollision ",-1)),He=l(()=>s("label",{class:"hide",for:"restoreOnDrag"}," restoreOnDrag ",-1)),Pe=l(()=>s("label",{class:"",for:"showCloseButton"}," showCloseButton ",-1)),Te=l(()=>s("label",{class:"hide",for:"showGridLines"}," showGridLines ",-1)),je=l(()=>s("label",{class:"hide",for:"useBorderRadius"}," useBorderRadius ",-1)),Ae=l(()=>s("label",{class:"hide",for:"verticalCompact"}," verticalCompact ",-1)),$e={class:"row"},Xe={class:"col-sm-2 hide"},Ye={class:"col-sm-7"},Fe={class:"layoutJSON"},Je=l(()=>s("code",null,"[x, y, w, h]",-1)),We={class:"columns"},qe=l(()=>s("div",{class:"col-sm-3 hide"},[s("textarea",{style:{width:"100%","margin-top":"15px",height:"150px","border-radius":"12px"}})],-1)),Ke=l(()=>s("div",{style:{"font-size":"0",height:"5px",margin:"0",padding:"0"}},null,-1)),Qe={class:"row"},Ze={class:"col-sm"},es={class:"layout"},ss={id:"content",class:"content"},ts={class:"text"},os=de({__name:"13-example",setup(g){re(o=>({a7ee6f02:c.value,"14a14290":o.rowHeightPx}));const x=a(!0),c=a(12),_=a(!0),z=a(!1),k=a(!1),y=a(!1),D=a(!1),B=a(!1),V=a(!0),U=a(40),E=a(!1),S=a(!1),M=a(50),I=a(!1),L=a(!1),G=a(!1),w=a(!0),N=a(!0),i=a(be),h=a(),O=new Map;let T=c.value;const J=o=>{T!==o&&(T=o,c.value=o)},W=()=>{},q=()=>{},K=()=>{},Q=()=>{},Z=()=>{},ee=()=>{},se=()=>{},te=o=>{i.value=i.value.filter(t=>t.i!==o)},oe=o=>{let t=o.i;return o.isStatic&&(t+=" - Static"),t},le=o=>{o&&o.i&&O.set(o.i,o)},r={x:0,y:0},u={h:1,i:"",w:1,x:0,y:0},ae=o=>{if(o.stopPropagation(),o.preventDefault(),!_.value&&!y.value)return;const e=document.getElementById("content").getBoundingClientRect();let p=!1;r.x>e.left&&r.x<e.right&&r.y>e.top&&r.y<e.bottom&&(p=!0),p===!0&&i.value.findIndex(v=>v.i==="drop")===-1&&i.value.push({h:2,i:"drop",w:2,x:i.value.length*2%c.value,y:i.value.length+c.value});const R=i.value.findIndex(v=>v.i==="drop");if(R!==-1){try{h.value.defaultGridItem.$el.style.display="none"}catch{}const v=O.get("drop");if(!v)return;v.dragging={left:r.x-e.left,top:r.y-e.top};const C=v.calcXY(r.y-e.top,r.x-e.left);p===!0&&(h.value.dragEvent("dragstart","drop",C.x,C.y,2,2),u.i=String(R),u.x=i.value[R].x,u.y=i.value[R].y),p===!1&&(h.value.dragEvent("dragend","drop",C.x,C.y,2,2),i.value=i.value.filter(ne=>ne.i!=="drop"))}},ie=()=>{const t=document.getElementById("content").getBoundingClientRect();let e=!1;r.x>t.left&&r.x<t.right&&r.y>t.top&&r.y<t.bottom&&(e=!0),e===!0&&(h.value.dragEvent("dragend","drop",u.x,u.y,2,2),i.value=i.value.filter(p=>p.i!=="drop"),ve(()=>{i.value.push({h:1,i:u.i,minH:1,minW:1,w:1,x:u.x,y:u.y}),h.value.dragEvent("dragend",u.i,u.x,u.y,2,2),O.delete("drop")}))},j=o=>{r.x=o.clientX,r.y=o.clientY};return ue(()=>{document.addEventListener("dragover",j)}),ce(()=>{document.removeEventListener("dragover",j)}),(o,t)=>(f(),b("div",ye,[s("div",we,[s("div",Re,[s("form",null,[s("fieldset",null,[Ce,ze,n(s("input",{id:"rowHeight","onUpdate:modelValue":t[0]||(t[0]=e=>M.value=e),class:"hide",type:"number"},null,512),[[H,M.value]]),ke,n(s("input",{id:"colNum","onUpdate:modelValue":t[1]||(t[1]=e=>c.value=e),class:"hide",type:"number"},null,512),[[H,c.value]]),De,n(s("input",{id:"maxRows","onUpdate:modelValue":t[2]||(t[2]=e=>U.value=e),class:"hide",type:"number"},null,512),[[H,U.value]]),Be,Ve,n(s("input",{id:"autosize","onUpdate:modelValue":t[3]||(t[3]=e=>x.value=e),class:"hide",type:"checkbox"},null,512),[[d,x.value]]),Ue,n(s("input",{id:"editMode","onUpdate:modelValue":t[4]||(t[4]=e=>_.value=e),class:"hide",type:"checkbox"},null,512),[[d,_.value]]),Ee,n(s("input",{id:"horizontalShift","onUpdate:modelValue":t[5]||(t[5]=e=>z.value=e),class:"hide",type:"checkbox"},null,512),[[d,z.value]]),Se,n(s("input",{id:"isBounded","onUpdate:modelValue":t[6]||(t[6]=e=>k.value=e),class:"hide",type:"checkbox"},null,512),[[d,k.value]]),Me,n(s("input",{id:"isDraggable","onUpdate:modelValue":t[7]||(t[7]=e=>y.value=e),class:"hide",type:"checkbox"},null,512),[[d,y.value]]),Ie,n(s("input",{id:"isMirrored","onUpdate:modelValue":t[8]||(t[8]=e=>D.value=e),class:"hide",type:"checkbox"},null,512),[[d,D.value]]),Le,n(s("input",{id:"isResizable","onUpdate:modelValue":t[9]||(t[9]=e=>B.value=e),class:"hide",type:"checkbox"},null,512),[[d,B.value]]),Ge,n(s("input",{id:"isResponsive","onUpdate:modelValue":t[10]||(t[10]=e=>V.value=e),class:"hide",type:"checkbox"},null,512),[[d,V.value]]),Ne,n(s("input",{id:"preserveAspectRatio","onUpdate:modelValue":t[11]||(t[11]=e=>E.value=e),class:"hide",type:"checkbox"},null,512),[[d,E.value]]),Oe,n(s("input",{id:"preventCollision","onUpdate:modelValue":t[12]||(t[12]=e=>S.value=e),class:"hide",type:"checkbox"},null,512),[[d,S.value]]),He,n(s("input",{id:"restoreOnDrag","onUpdate:modelValue":t[13]||(t[13]=e=>I.value=e),class:"hide",type:"checkbox"},null,512),[[d,I.value]]),Pe,n(s("input",{id:"showCloseButton","onUpdate:modelValue":t[14]||(t[14]=e=>L.value=e),class:"",type:"checkbox"},null,512),[[d,L.value]]),Te,n(s("input",{id:"showGridLines","onUpdate:modelValue":t[15]||(t[15]=e=>G.value=e),class:"hide",type:"checkbox"},null,512),[[d,G.value]]),je,n(s("input",{id:"useBorderRadius","onUpdate:modelValue":t[16]||(t[16]=e=>w.value=e),class:"hide",type:"checkbox"},null,512),[[d,w.value]]),Ae,n(s("input",{id:"verticalCompact","onUpdate:modelValue":t[17]||(t[17]=e=>N.value=e),class:"hide",type:"checkbox"},null,512),[[d,N.value]])])])])]),s("div",$e,[s("div",Xe,[s("div",{class:"droppable-element",draggable:"true",onDrag:ae,onDragend:ie}," Droppable Element (Drag me!) ",32)]),s("div",Ye,[s("div",Fe,[P(" Displayed as "),Je,P(": "),s("div",We,[(f(!0),b(A,null,$(i.value,e=>(f(),b("div",{key:e.i},[s("b",null,m(e.i),1),P(": ["+m(e.x)+", "+m(e.y)+", "+m(e.w)+", "+m(e.h)+"] ",1)]))),128))])])]),qe]),Ke,s("div",Qe,[s("div",Ze,[s("div",es,[s("div",ss,[F(Y(_e),{ref_key:"refLayout",ref:h,layout:i.value,"onUpdate:layout":t[18]||(t[18]=e=>i.value=e),"auto-size":x.value,class:pe({grid:G.value}),"col-num":c.value,"horizontal-shift":z.value,"is-bounded":k.value,"is-draggable":y.value,"is-mirrored":D.value,"is-resizable":B.value,margin:[10,10],"max-rows":U.value,"prevent-collision":S.value,responsive:V.value,"restore-on-drag":I.value,"row-height":M.value,"use-border-radius":w.value,"use-css-transforms":!0,"vertical-compact":N.value,onColumnsChanged:J},{default:X(()=>[(f(!0),b(A,null,$(i.value,e=>(f(),he(Y(xe),{key:e.i,ref_for:!0,ref:p=>le(p),class:"test","enable-edit-mode":_.value,h:e.h,i:e.i,"is-draggable":e.isDraggable,"is-resizable":e.isResizable,"is-static":e.isStatic,"min-h":e.minH,"min-w":e.minW,"preserve-aspect-ratio":E.value,"show-close-button":L.value,"use-border-radius":w.value,w:e.w,x:e.x,y:e.y,onContainerResized:W,onDrag:q,onDragged:K,onMove:Q,onMoved:Z,onRemoveGridItem:te,onResize:ee,onResized:se},{default:X(()=>[s("span",ts,m(oe(e)),1)]),_:2},1032,["enable-edit-mode","h","i","is-draggable","is-resizable","is-static","min-h","min-w","preserve-aspect-ratio","show-close-button","use-border-radius","w","x","y"]))),128))]),_:1},8,["layout","auto-size","class","col-num","horizontal-shift","is-bounded","is-draggable","is-mirrored","is-resizable","max-rows","prevent-collision","responsive","restore-on-drag","row-height","use-border-radius","vertical-compact"])])])])])]))}}),ls=ge(os,[["__scopeId","data-v-bda73729"]]),as=s("h1",{id:"show-default-close-button",tabindex:"-1"},"Show Default Close Button",-1),is=s("p",null,"Select the showClosebutton to display the default close button. Click on the button and the item will be removed from the layout.",-1),us=JSON.parse('{"title":"Show Default Close Button","description":"","frontmatter":{},"headers":[],"relativePath":"examples/13-example.md","filePath":"examples/13-example.md","lastUpdated":1703794519000}'),ns={name:"examples/13-example.md"},cs=Object.assign(ns,{setup(g){return(x,c)=>(f(),b("div",null,[as,is,F(ls)]))}});export{us as __pageData,cs as default};
