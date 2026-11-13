import { NumberField } from './NumberField';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Segmented } from './ChoiceControls';
import { Plus, Trash2 } from 'lucide-react';
import { getFurnitureLayout, type FurnitureConfig } from '@/lib/furniture';
import { t, formatMm, useLang } from '@/lib/i18n';

interface Props { config: FurnitureConfig; onChange: (config: FurnitureConfig) => void; showDrawers?: boolean }

export function FurnitureExtras({config, onChange, showDrawers=true}: Props) {
  useLang();
  const layout = getFurnitureLayout(config);
  const bands = !!config.bandeauHaut || !!config.bandeauBas;
  const nextFrontHeight = layout.frontFreeHeight - 2;
  return <div className="space-y-5 border-t border-border pt-4">
    <div className="flex items-center gap-3 [&>button]:shrink-0">
      <Checkbox id="enable-bands" checked={bands} onCheckedChange={checked => onChange({...config,bandeauHaut:checked ? {hauteur:150,remplaceTraverse:true,faceApplique:false} : undefined,bandeauBas:undefined})} />
      <Label className="block leading-5" htmlFor="enable-bands">{t("Bandeau fixe")}</Label>
    </div>
    {bands && <div className="space-y-4 pl-1">
      <div>
        <Label className="block leading-5" htmlFor="band-position">{t("Emplacement")}</Label>
        <Select value={config.bandeauHaut && config.bandeauBas ? 'both' : config.bandeauHaut ? 'haut' : 'bas'} onValueChange={value => {
          const existing = config.bandeauHaut ?? config.bandeauBas ?? {hauteur:150,remplaceTraverse:true,faceApplique:false};
          onChange({...config,bandeauHaut:value !== 'bas' ? config.bandeauHaut ?? {...existing} : undefined,bandeauBas:value !== 'haut' ? config.bandeauBas ?? {...existing} : undefined});
        }}>
          <SelectTrigger className="h-auto min-h-11 text-left [&>span]:line-clamp-none [&>span]:whitespace-normal [&>span]:pr-2 [&>svg]:shrink-0" id="band-position"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="haut">{t("En haut · sous évier")}</SelectItem><SelectItem value="bas">{t("En bas · meuble hotte")}</SelectItem><SelectItem value="both">{t("En haut et en bas")}</SelectItem></SelectContent>
        </Select>
      </div>
      {(['haut','bas'] as const).map(position => {
        const key = position === 'haut' ? 'bandeauHaut' : 'bandeauBas';
        const band = config[key];
        if (!band) return null;
        return <div key={position} className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            <div><NumberField id={`band-height-${position}`} label={t("Hauteur bandeau {position} (mm)", { position: t(position) })} value={band.hauteur} min="1" onCommit={v => onChange({...config,[key]:{...band,hauteur:v}})} /></div>
            <Segmented id={`band-mode-${position}`} label={position === 'haut' ? t('Traverse haute') : t('Traverse basse')} value={band.remplaceTraverse ? 'replace' : 'keep'} options={[['replace',t('Remplacée par le bandeau')],['keep',t('Conservée avec le bandeau')]]} onChange={value => onChange({...config,[key]:{...band,remplaceTraverse:value === 'replace'}})} />
          </div>
          <div className="flex items-center gap-3 [&>button]:shrink-0"><Checkbox id={`band-front-${position}`} checked={band.faceApplique} onCheckedChange={checked => onChange({...config,[key]:{...band,faceApplique:checked === true,cachePorte:checked === true ? false : band.cachePorte}})} /><Label className="block leading-5" htmlFor={`band-front-${position}`}>{t("Face fixe en applique · {position}", { position: t(position) })}</Label></div>
          {((config.nombrePortes > 0 && config.typePorte === 'applique') || band.cachePorte) && <div className="flex items-center gap-3 [&>button]:shrink-0"><Checkbox id={`band-hidden-${position}`} checked={band.cachePorte === true} onCheckedChange={checked => onChange({...config,[key]:{...band,cachePorte:checked === true,faceApplique:checked === true ? false : band.faceApplique}})} /><Label className="block leading-5" htmlFor={`band-hidden-${position}`}>{t("Caché derrière la porte · {position}", { position: t(position) })}</Label></div>}
        </div>;
      })}
    </div>}
    {showDrawers && <div className="flex items-center gap-3 [&>button]:shrink-0">
      <Checkbox id="enable-drawers" checked={!!config.tiroirs} onCheckedChange={checked => onChange({...config,tiroirs:checked ? {position:'haut',hauteurs:[150]} : undefined})} />
      <Label className="block leading-5" htmlFor="enable-drawers">{t("Meuble à tiroirs")}</Label>
    </div>}
    {config.tiroirs && <div className="space-y-3 pl-1">
      <div className="flex items-center gap-3 [&>button]:shrink-0"><Checkbox id="drawers-with-door" checked={config.nombrePortes > 0} onCheckedChange={checked => onChange({...config,nombrePortes:checked ? 1 : 0,typePorte:checked && config.nombrePortes === 0 && (config.tiroirs || config.tiroirsCompartiments) ? 'applique' : config.typePorte})} /><Label className="block leading-5" htmlFor="drawers-with-door">{t("Avec porte")}</Label></div>
      <Segmented id="drawer-position" label={t("Position des tiroirs")} value={config.tiroirs.position} options={[['haut',config.nombrePortes > 0 ? t('Au-dessus de la porte') : t('En haut')],['bas',config.nombrePortes > 0 ? t('Au-dessous de la porte') : t('En bas')]]} onChange={v => {if (config.tiroirs) onChange({...config,tiroirs:{...config.tiroirs,position:v as 'haut'|'bas'}});}} />
      {config.tiroirs.hauteurs.map((height,index) => <div key={index} className="flex items-end gap-2">
        <div className="min-w-0 flex-1"><NumberField id={`drawer-height-${index}`} label={t("Hauteur face tiroir {n} (mm)", { n: index+1 })} value={height} min="1" onCommit={v => {if (config.tiroirs) onChange({...config,tiroirs:{...config.tiroirs,hauteurs:config.tiroirs.hauteurs.map((h,i) => i === index ? v : h)}});}} /></div>
        <Button variant="ghost" size="icon" title={t("Supprimer la face tiroir {n}", { n: index+1 })} aria-label={t("Supprimer la face tiroir {n}", { n: index+1 })} onClick={() => {if (!config.tiroirs) return; const heights=config.tiroirs.hauteurs.filter((_,i) => i !== index); onChange({...config,tiroirs:heights.length ? {...config.tiroirs,hauteurs:heights} : undefined});}}><Trash2 className="h-4 w-4" /></Button>
      </div>)}
      <p aria-live="polite" className="text-sm text-muted-foreground">{t("Hauteur restante, jeux déduits : ")}<span className="font-medium text-foreground">{formatMm(layout.frontFreeHeight)} mm</span></p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="h-auto min-h-11 whitespace-normal text-left" disabled={!(nextFrontHeight > 0)} onClick={() => {if (config.tiroirs) onChange({...config,tiroirs:{...config.tiroirs,hauteurs:[...config.tiroirs.hauteurs,Math.min(150,nextFrontHeight)]}});}}><Plus className="mr-2 h-4 w-4" />{t("Ajouter une face de tiroir")}</Button>
        {config.nombrePortes === 0 && layout.frontFreeHeight > 0 && <Button variant="outline" size="sm" className="h-auto min-h-11 whitespace-normal text-left" onClick={() => {if (!config.tiroirs) return; const last=config.tiroirs.hauteurs.length-1; onChange({...config,tiroirs:{...config.tiroirs,hauteurs:config.tiroirs.hauteurs.map((h,i) => i === last ? h+layout.frontFreeHeight : h)}});}}>{t("Compléter avec la dernière face")}</Button>}
      </div>
    </div>}
    {(bands || config.tiroirs) && config.nombrePortes > 0 && <p className="text-sm text-muted-foreground">{t("Hauteur de porte : ")}<span className="font-medium text-foreground">{formatMm(Math.max(0,layout.doorHeight))} mm</span></p>}
  </div>;
}