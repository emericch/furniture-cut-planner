import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { FurnitureExtras } from './FurnitureExtras';
import { CabinetDrawing } from './CabinetDrawing';
import { getFurnitureLayout, formatMm, type FurnitureConfig } from '@/lib/furniture';
interface Props { config: FurnitureConfig; onChange:(c:FurnitureConfig)=>void }
function Choice({label,value,options,onChange}:{label:string;value:string;options:[string,string][];onChange:(v:string)=>void}) {
 return <div className="min-w-0 space-y-2"><Label className="block leading-5" htmlFor={label}>{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger id={label} className="h-auto min-h-11 text-left [&>span]:line-clamp-none [&>span]:whitespace-normal [&>span]:break-words [&>span]:pr-2 [&>svg]:shrink-0"><SelectValue/></SelectTrigger><SelectContent className="max-w-[calc(100vw-2rem)]">{options.map(([v,text])=><SelectItem className="whitespace-normal" key={v} value={v}>{text}</SelectItem>)}</SelectContent></Select></div>;
}
function Numeric({label,value,onChange}:{label:string;value:number;onChange:(v:number)=>void}) {
 return <div className="min-w-0 flex-1 space-y-2"><Label className="block leading-5" htmlFor={label}>{label}</Label><Input id={label} type="number" min="0" value={value} onChange={e=>onChange(Number(e.target.value))}/></div>;
}
export function FurnitureDesigner({config:c,onChange}:Props) {
 const sections=useRef<Array<HTMLElement | null>>([]); const [side,setSide]=useState<'gauche'|'droite'>('gauche'); const [view,setView]=useState<'interieur'|'facades'>('interieur');
 const l=getFurnitureLayout(c); const update=(v:Partial<FurnitureConfig>)=>onChange({...c,...v}); const steps=['Dimensions hors-tout','Structure et dos','Étagères (rayons)','Portes, bandeaux et tiroirs'];
 const selectSection=(next:number,selectedSide?:'gauche'|'droite')=>{if(selectedSide)setSide(selectedSide);sections.current[next]?.scrollIntoView({behavior:'smooth',block:'start'});};
 const counts=c.rayonsCompartiments?.[side] ?? {mobiles:0,fixes:0}; const drawer=c.tiroirsCompartiments;
 const setCounts=(key:'mobiles'|'fixes',n:number)=>update({rayonsCompartiments:{gauche:c.rayonsCompartiments?.gauche ?? {mobiles:0,fixes:0},droite:c.rayonsCompartiments?.droite ?? {mobiles:0,fixes:0},[side]:{...counts,[key]:n}}});
 const setHeights=(heights:number[])=>{if(drawer)update({tiroirsCompartiments:{...drawer,[side]:heights}});};
 return <div className="space-y-5">
 <div className="grid min-w-0 gap-6 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] xl:grid-cols-1">
 <aside className="min-w-0 space-y-4 md:sticky md:top-4 md:self-start xl:static">
 <div className="flex justify-center gap-2"><Button size="sm" variant={view==='interieur'?'secondary':'outline'} onClick={()=>setView('interieur')}>Intérieur</Button><Button size="sm" variant={view==='facades'?'secondary':'outline'} onClick={()=>setView('facades')}>Façades</Button></div>
 <CabinetDrawing config={c} view={view} onSelect={selectSection} />
 </aside>
 <div className="min-w-0 space-y-6">
 <section ref={el=>{sections.current[0]=el;}} className="scroll-mt-4 space-y-4 border-t border-border pt-4" aria-label={steps[0]}><h2 className="font-semibold">{steps[0]}</h2>
 <><div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-3">{(['hauteur','largeur','profondeur'] as const).map(k=><Numeric key={k} label={`${k[0].toUpperCase()+k.slice(1)} hors-tout (mm)`} value={c[k]} onChange={v=>update({[k]:v})}/>)}</div><h3 className="font-medium">Épaisseurs (mm)</h3><div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3">{([['epaisseurMontants','Montants'],['epaisseurTraverses','Traverses / bandeaux'],['epaisseurRayons','Rayons'],['epaisseurDos','Dos'],['epaisseurPortes','Façades']] as const).map(([k,label])=><Choice key={k} label={label} value={String(c[k])} options={(k==='epaisseurDos'?[3,8,16,19,22]:k==='epaisseurPortes'?[16,19,22]:[8,16,19,22]).map(v=>[String(v),String(v)])} onChange={v=>update({[k]:Number(v)})}/>)}</div></>
 </section><section ref={el=>{sections.current[1]=el;}} className="scroll-mt-4 space-y-4 border-t border-border pt-4" aria-label={steps[1]}><h2 className="font-semibold">{steps[1]}</h2><><Choice label="Assemblage du meuble" value={c.montantsTouteHauteur?'montants':'traverses'} options={[["montants","Montants toute hauteur"],["traverses","Traverses toute largeur"]]} onChange={v=>update({montantsTouteHauteur:v==='montants',traversesTouteLargeur:v==='traverses'})}/>
 <Choice label="Séparation centrale" value={c.montantIntermediaire ?? 'aucun'} options={[["aucun","Sans montant"],["entre-traverses","Entre la traverse haute et basse"],["toute-hauteur","Sur toute la hauteur du meuble"]]} onChange={v=>update({montantIntermediaire:v==='aucun'?undefined:v as 'entre-traverses'|'toute-hauteur',rayonsCompartiments:c.rayonsCompartiments ?? {gauche:{mobiles:c.nombreRayons,fixes:c.nombreRayonsFixes ?? 0},droite:{mobiles:0,fixes:0}},tiroirsCompartiments:v==='aucun'?undefined:c.tiroirsCompartiments})}/>
 <Choice label="Pose du dos" value={c.dosType} options={[["aucun","Sans dos"],["toute-hauteur","Toute hauteur"],["toute-largeur","Toute largeur"],["en-applique","En applique"],["entre-montants-traverses","Entre montants et traverses"],["en-rainure","En rainure · 5 mm"]]} onChange={v=>update({dosType:v as FurnitureConfig['dosType'],decalageDos:v==='en-applique'?0:c.decalageDos})}/>
 {c.montantIntermediaire && c.dosType!=='aucun' && <Choice label="Répartition du dos" value={c.dosParCompartiment?'separe':'unique'} options={[["unique","Un dos pour tout le meuble"],["separe","Un dos par compartiment"]]} onChange={v=>update({dosParCompartiment:v==='separe'})}/>}
 {c.dosType!=='aucun' && c.dosType!=='en-applique' && <Numeric label="Retrait du dos depuis l’arrière (mm)" value={c.decalageDos} onChange={v=>update({decalageDos:v})}/>}</>
 </section><section ref={el=>{sections.current[2]=el;}} className="scroll-mt-4 space-y-4 border-t border-border pt-4" aria-label={steps[2]}><h2 className="font-semibold">{steps[2]}</h2><>{c.montantIntermediaire && <Choice label="Côté à régler" value={side} options={[["gauche","Gauche"],["droite","Droite"]]} onChange={v=>setSide(v as 'gauche'|'droite')}/>}
 <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3"><Numeric label="Étagères mobiles" value={c.montantIntermediaire?counts.mobiles:c.nombreRayons} onChange={v=>c.montantIntermediaire?setCounts('mobiles',v):update({nombreRayons:v})}/><Numeric label="Étagères fixes" value={c.montantIntermediaire?counts.fixes:c.nombreRayonsFixes ?? 0} onChange={v=>c.montantIntermediaire?setCounts('fixes',v):update({nombreRayonsFixes:v})}/></div><Numeric label="Retrait des rayons depuis l’avant (mm)" value={c.retraitRayons} onChange={v=>update({retraitRayons:v})}/><p className="text-sm text-muted-foreground">Largeur fixe : {formatMm(c.montantIntermediaire?l.bayWidth:c.largeur-2*c.epaisseurMontants)} mm · mobile : {formatMm((c.montantIntermediaire?l.bayWidth:c.largeur-2*c.epaisseurMontants)-1)} mm</p></>
 </section><section ref={el=>{sections.current[3]=el;}} className="scroll-mt-4 space-y-4 border-t border-border pt-4" aria-label={steps[3]}><h2 className="font-semibold">{steps[3]}</h2><><Choice label="Nombre de portes" value={String(c.nombrePortes)} options={[["0","Aucune"],["1","1 porte"],["2","2 portes"]]} onChange={v=>{update({nombrePortes:Number(v) as 0|1|2});setView('facades');}}/>{c.nombrePortes>0 && <Choice label="Pose des portes" value={c.typePorte} options={[["applique","En applique"],["interieur","À l’intérieur du meuble"]]} onChange={v=>{update({typePorte:v as 'applique'|'interieur'});setView('facades');}}/>}
 {c.montantIntermediaire && <Choice label="Répartition des tiroirs" value={drawer?'separes':'communs'} options={[["communs","Sur toute la largeur du meuble"],["separes","Séparés à gauche et à droite"]]} onChange={v=>update({tiroirs:v==='separes'?undefined:c.tiroirs,tiroirsCompartiments:v==='separes'?{position:'haut',gauche:[150],droite:[150]}:undefined})}/>}
 <FurnitureExtras config={c} onChange={onChange} showDrawers={!drawer}/>
 {drawer && <><Choice label="Position des tiroirs" value={drawer.position} options={[["haut","En haut"],["bas","En bas"]]} onChange={v=>update({tiroirsCompartiments:{...drawer,position:v as 'haut'|'bas'}})}/><Choice label="Côté des tiroirs" value={side} options={[["gauche","Gauche"],["droite","Droite"]]} onChange={v=>setSide(v as 'gauche'|'droite')}/>
 {drawer[side].map((h,i)=><div key={i} className="flex items-end gap-2"><Numeric label={`Face ${i+1} · hauteur (mm)`} value={h} onChange={v=>setHeights(drawer[side].map((x,j)=>j===i?v:x))}/><Button variant="ghost" size="icon" aria-label={`Supprimer tiroir ${side} ${i+1}`} onClick={()=>setHeights(drawer[side].filter((_,j)=>j!==i))}><Trash2 className="h-4 w-4"/></Button></div>)}
 <Button variant="outline" className="h-auto min-h-11 whitespace-normal" onClick={()=>setHeights([...drawer[side],150])}><Plus className="h-4 w-4 mr-2"/>Ajouter un tiroir {side}</Button><p className="text-sm text-muted-foreground">Hauteur restante commune : {formatMm(l.frontFreeHeight)} mm</p><p aria-live="polite" className="text-sm text-muted-foreground">Hauteur restante {side} : {formatMm(l.drawerRemaining[side])} mm</p>
 {c.nombrePortes===0 && drawer[side].length>0 && <Button variant="outline" className="h-auto min-h-11 whitespace-normal" disabled={l.drawerRemaining[side]<=0} onClick={()=>setHeights(drawer[side].map((h,i)=>i===drawer[side].length-1?h+l.drawerRemaining[side]:h))}>Compléter la dernière face {side}</Button>}
 </>
 </>
 </section></div></div></div>;
}
