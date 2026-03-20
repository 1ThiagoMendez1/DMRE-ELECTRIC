"use client";

import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Cotizacion } from "@/types/sistema";
import { PDFStyleConfig } from "@/utils/pdf-styles";

interface QuotePreviewProps {
    quote: Cotizacion;
    currentStyle: PDFStyleConfig;
    companyInfo: {
        nombre: string;
        nit: string;
        direccion: string;
        telefono: string;
        email: string;
        descripcion: string;
    };
    preparedByFallback?: string;
    materialVisibilityMode?: 'MOSTRAR_TODO' | 'MODO_PRIVADO' | 'OCULTAR_TODO';
    privadoOptions?: {
        suministros: string;
        instalacion: string;
        servicios: string;
    };
}

// Helper: RGB to Hex
const rgbToHex = (c: [number, number, number]) => "#" + c.map(x => x.toString(16).padStart(2, '0')).join('');

export function QuotePreview({ quote, currentStyle, companyInfo, preparedByFallback, materialVisibilityMode = 'MOSTRAR_TODO', privadoOptions }: QuotePreviewProps) {
    return (
        <Card
            className="w-full max-w-[800px] bg-white shadow-xl min-h-[1000px] origin-top transition-all duration-300 overflow-hidden relative"
            style={{ fontFamily: currentStyle.fonts.body === 'times' ? 'Times New Roman, serif' : currentStyle.fonts.body === 'courier' ? 'Courier New, monospace' : 'Arial, sans-serif' }}
        >
            <div className="relative p-0 h-full flex flex-col">
                {/* HEADER BAR if applicable */}
                {currentStyle.components.headerStyle === 'bar' && (
                    <div className="h-2 w-full" style={{ backgroundColor: rgbToHex(currentStyle.colors.primary) }} />
                )}

                <div className="p-8 relative z-10">
                    {/* HEADER CONTENT */}
                    {currentStyle.layout === 'official_grid' ? (
                        <div className="mb-4 border-2 border-black p-2 text-black text-left">
                            <div className="flex items-center justify-between gap-4">
                                <div className="w-[100px] h-[100px] flex items-center justify-center border-r-2 border-black pr-2">
                                    <img src="/logo.png" alt="Logo" className="max-w-full max-h-full object-contain" />
                                </div>
                                <div className="flex-1 text-center px-4">
                                    <h3 className="text-xl font-bold uppercase" style={{ fontFamily: 'Times New Roman, serif', color: rgbToHex(currentStyle.colors.primary) }}>
                                        DISEÑO Y MONTAJE DE REDES ELÉCTRICAS D.M.R.E
                                    </h3>
                                    <div className="text-[9px] mt-1 space-y-0.5">
                                        <p>{companyInfo.email}</p>
                                        <p>{companyInfo.telefono}</p>
                                        <p className="text-black">www.dmreingenieria.com</p>
                                    </div>
                                </div>
                                <div className="w-[120px] text-right border-l-2 border-black pl-2 space-y-2">
                                    <p className="font-bold text-[10px]">SGI-DMRE-0818</p>
                                    <p className="text-[9px]">{format(new Date(), "d/MM/yyyy")}</p>
                                    <p className="font-bold text-[10px]">Versión 2.1</p>
                                </div>
                            </div>

                            {/* Technical Grid inside header or below */}
                            <div className="mt-4 border-t-2 border-black">
                                <div className="grid grid-cols-12">
                                    {/* Left: Client Info (7/12) */}
                                    <div className="col-span-7 border-r-2 border-black">
                                        {[
                                            { label: 'Cliente', value: typeof quote.cliente === 'string' ? quote.cliente : quote.cliente?.nombre },
                                            { label: 'C.C / NIT', value: typeof quote.cliente === 'string' ? '' : quote.cliente?.documento },
                                            { label: 'Dirección', value: typeof quote.cliente === 'string' ? '' : quote.cliente?.direccion },
                                            { label: 'E-mail', value: typeof quote.cliente === 'string' ? '' : quote.cliente?.correo || '' },
                                            { label: 'Teléfono', value: typeof quote.cliente === 'string' ? '' : quote.cliente?.telefono || '' }
                                        ].map((row, i) => (
                                            <div key={i} className={`flex border-b-2 border-black last:border-0 h-6 items-center px-1`}>
                                                <div className="w-28 text-[9px] font-bold flex items-center gap-1">
                                                    {row.label}
                                                </div>
                                                <div className="flex-1 text-[9px] border-l-2 border-black pl-2 truncate">{row.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Right: Meta Info (5/12) */}
                                    <div className="col-span-5 flex flex-col">
                                        <div className="flex border-b-2 border-black h-6 items-center px-1">
                                            <div className="w-32 text-[9px] font-bold">Elaborado por</div>
                                            <div className="flex-1 text-[9px] border-l-2 border-black pl-2 flex items-center">
                                                <span className="italic">{quote.elaboradoPor || preparedByFallback || "José Gabriel Ramirez Bernal"}</span>
                                            </div>
                                        </div>
                                        <div className="flex border-b-2 border-black h-6 items-center px-1">
                                            <div className="w-32 text-[9px] font-bold">Fecha Cotización</div>
                                            <div className="flex-1 text-[9px] border-l-2 border-black pl-2">{format(new Date(quote.fecha), "dd/MM/yyyy")}</div>
                                        </div>
                                        <div className="flex border-b-2 border-black h-6 items-center px-1">
                                            <div className="w-32 text-[9px] font-bold">Fecha Vencimiento</div>
                                            <div className="flex-1 text-[9px] border-l-2 border-black pl-2">{format(quote.fechaValidez ? new Date(quote.fechaValidez) : new Date(new Date(quote.fecha).getTime() + 15 * 24 * 60 * 60 * 1000), "dd/MM/yyyy")}</div>
                                        </div>
                                        <div className="flex-1 flex flex-col items-center justify-center p-1 bg-gray-100/50">
                                            <p className="text-[9px] font-bold uppercase text-black">NÚMERO DE OFERTA</p>
                                            <p className="text-xl font-bold italic" style={{ color: rgbToHex(currentStyle.colors.secondary) }}>{quote.numero}</p>
                                        </div>
                                    </div>
                                </div>
                                {/* Full width "Trabajo a realizar" row */}
                                <div className="grid grid-cols-12 border-t-2 border-black h-12">
                                    <div className="col-span-2 text-[9px] font-bold flex flex-col items-center justify-center text-center px-1 border-r-2 border-black">
                                        Trabajo a realizar
                                    </div>
                                    <div className="col-span-10 text-[9px] p-2 flex items-center uppercase">
                                        {quote.descripcionTrabajo}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-8 flex justify-between">
                            <div className="flex items-start gap-4">
                                <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain bg-white rounded-md p-1" />
                                <div>
                                    <h3 className="text-2xl font-bold" style={{ color: rgbToHex(currentStyle.colors.primary) }}>{companyInfo.nombre}</h3>
                                    <p className="text-sm font-medium text-gray-600">{companyInfo.descripcion}</p>
                                    <div className="text-xs mt-2 space-y-0.5 text-gray-500">
                                        <p>NIT: {companyInfo.nit}</p>
                                        <p>{companyInfo.direccion}</p>
                                        <p>{companyInfo.telefono} | {companyInfo.email}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="p-4 rounded-lg bg-gray-50 text-black">
                                    <h2 className="text-xl font-bold" style={{ color: rgbToHex(currentStyle.colors.secondary) }}>COTIZACIÓN</h2>
                                    <p className="text-lg font-mono" style={{ color: rgbToHex(currentStyle.colors.secondary) }}>{quote.numero}</p>
                                    <div className="text-sm text-gray-500 mt-2 space-y-0.5">
                                        <p>Fecha: {format(new Date(quote.fecha), "dd MMMM yyyy", { locale: es })}</p>
                                        <p>Vence: {format(quote.fechaValidez ? new Date(quote.fechaValidez) : new Date(new Date(quote.fecha).getTime() + 15 * 24 * 60 * 60 * 1000), "dd MMMM yyyy", { locale: es })}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CLIENT & BODY - Standard if NOT official_grid */}
                    {currentStyle.layout !== 'official_grid' && (
                        <>
                            <div className="mb-8 p-4 rounded bg-gray-50 text-black">
                                <h3 className="font-bold mb-2 uppercase text-sm" style={{ color: rgbToHex(currentStyle.colors.primary) }}>CLIENTE:</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                                    <p className="font-bold col-span-2 text-base text-black">{typeof quote.cliente === 'string' ? quote.cliente : quote.cliente?.nombre}</p>
                                    <p><span className="opacity-70">NIT/CC:</span> {typeof quote.cliente === 'string' ? '' : quote.cliente?.documento}</p>
                                    <p><span className="opacity-70">Contacto:</span> {typeof quote.cliente === 'string' ? '' : quote.cliente?.contactoPrincipal}</p>
                                    <p className="col-span-2"><span className="opacity-70">Dirección:</span> {typeof quote.cliente === 'string' ? '' : quote.cliente?.direccion}</p>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h3 className="font-bold mb-2 uppercase text-sm" style={{ color: rgbToHex(currentStyle.colors.primary) }}>DESCRIPCIÓN TRABAJO:</h3>
                                <p className="text-sm bg-white p-2 rounded border border-transparent text-black">{quote.descripcionTrabajo}</p>
                            </div>
                        </>
                    )}

                    {/* TABLE */}
                    <div className="mb-8 text-black">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="border-b-2 border-black" style={{ backgroundColor: currentStyle.layout === 'official_grid' ? '#fff' : rgbToHex(currentStyle.colors.accent) }}>
                                    <th className="py-2 px-1 text-left w-10">IT</th>
                                    <th className="py-2 px-1 text-left">DESCRIPCIÓN</th>
                                    <th className="py-2 px-1 text-center w-16">CANT</th>
                                    <th className="py-2 px-1 text-center w-16">UND</th>
                                    <th className="py-2 px-1 text-right w-24">V. UNIT</th>
                                    <th className="py-2 px-1 text-right w-24">TOTAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {materialVisibilityMode === 'MODO_PRIVADO' ? (
                                    <>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2 px-1 align-top text-gray-500">1</td>
                                            <td className="py-2 px-1 align-top font-medium uppercase text-[11px] leading-tight">
                                                Suministros: {privadoOptions?.suministros || ''}
                                            </td>
                                            <td className="py-2 px-1 align-top text-center">-</td>
                                            <td className="py-2 px-1 align-top text-center">GLB</td>
                                            <td className="py-2 px-1 align-top text-right">-</td>
                                            <td className="py-2 px-1 align-top text-right font-bold">-</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2 px-1 align-top text-gray-500">2</td>
                                            <td className="py-2 px-1 align-top font-medium uppercase text-[11px] leading-tight">
                                                Instalación: {privadoOptions?.instalacion || ''}
                                            </td>
                                            <td className="py-2 px-1 align-top text-center">-</td>
                                            <td className="py-2 px-1 align-top text-center">GLB</td>
                                            <td className="py-2 px-1 align-top text-right">-</td>
                                            <td className="py-2 px-1 align-top text-right font-bold">-</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2 px-1 align-top text-gray-500">3</td>
                                            <td className="py-2 px-1 align-top font-medium uppercase text-[11px] leading-tight">
                                                Servicios: {privadoOptions?.servicios || ''}
                                            </td>
                                            <td className="py-2 px-1 align-top text-center">-</td>
                                            <td className="py-2 px-1 align-top text-center">GLB</td>
                                            <td className="py-2 px-1 align-top text-right">-</td>
                                            <td className="py-2 px-1 align-top text-right font-bold">-</td>
                                        </tr>
                                    </>
                                ) : materialVisibilityMode === 'OCULTAR_TODO' ? (
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 px-1 align-top text-gray-500">1</td>
                                        <td className="py-2 px-1 align-top font-medium uppercase text-[11px] leading-tight">
                                            {quote.descripcionTrabajo}
                                        </td>
                                        <td className="py-2 px-1 align-top text-center">1</td>
                                        <td className="py-2 px-1 align-top text-center">GLB</td>
                                        <td className="py-2 px-1 align-top text-right">${quote.subtotal.toLocaleString()}</td>
                                        <td className="py-2 px-1 align-top text-right font-bold">${quote.subtotal.toLocaleString()}</td>
                                    </tr>
                                ) : (
                                    quote.items.map((item, idx) => {
                                        const unitValue = item.valorUnitario + (item.porcentaje ? item.valorUnitario * (item.porcentaje / 100) : 0);
                                        const totalValue = unitValue * item.cantidad;
                                        return (
                                            <tr key={idx} className="border-b border-gray-100">
                                                <td className="py-2 px-1 align-top text-gray-500">{idx + 1}</td>
                                                <td className="py-2 px-1 align-top font-medium uppercase text-[11px] leading-tight">
                                                    {item.descripcion}
                                                    {item.subItems && item.subItems.length > 0 && !item.ocultarDetalles && (
                                                        <ul className="mt-1 ml-2 space-y-0.5 opacity-80 font-normal">
                                                            {item.subItems.map((sub: any, sidx: number) => (
                                                                <li key={sidx}>• {sub.nombre || sub.descripcion}</li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </td>
                                                <td className="py-2 px-1 align-top text-center">{item.cantidad}</td>
                                                <td className="py-2 px-1 align-top text-center">UND</td>
                                                <td className="py-2 px-1 align-top text-right">${unitValue.toLocaleString()}</td>
                                                <td className="py-2 px-1 align-top text-right font-bold">${totalValue.toLocaleString()}</td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* TOTALS */}
                    <div className="flex justify-end text-black">
                        <div className="w-64 space-y-1">
                            <div className="flex justify-between py-1 border-b text-xs">
                                <span>SUBTOTAL</span>
                                <span>${quote.subtotal.toLocaleString()}</span>
                            </div>

                            {(quote.descuentoGlobal || 0) > 0 && (
                                <>
                                    <div className="flex justify-between py-1 border-b text-xs text-red-600">
                                        <span>DESCUENTO ({quote.descuentoGlobalPorcentaje || 0}%)</span>
                                        <span>-${(quote.descuentoGlobal || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b text-xs font-bold w-full bg-gray-100/50">
                                        <span>SUBT. C/ DESCUENTO</span>
                                        <span>${(quote.subtotal - (quote.descuentoGlobal || 0)).toLocaleString()}</span>
                                    </div>
                                </>
                            )}

                            {/* AIU Section if applicable */}
                            {((quote.aiuAdmin || 0) > 0 || (quote.aiuImprevistos || 0) > 0 || (quote.aiuUtilidad || 0) > 0) && (
                                <div className="space-y-1 bg-gray-50 p-1 my-1 rounded">
                                    <div className="flex justify-between text-[10px]">
                                        <span>ADMINISTRACIÓN ({(quote.aiuAdminGlobalPorcentaje || 0)}%)</span>
                                        <span>${(quote.aiuAdmin || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px]">
                                        <span>IMPREVISTOS ({(quote.aiuImprevistoGlobalPorcentaje || 0)}%)</span>
                                        <span>${(quote.aiuImprevistos || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px]">
                                        <span>UTILIDAD ({(quote.aiuUtilidadGlobalPorcentaje || 0)}%)</span>
                                        <span>${(quote.aiuUtilidad || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between py-1 border-b text-xs">
                                <span>IVA ({(quote.impuestoGlobalPorcentaje || 19)}%)</span>
                                <span>${quote.iva.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-2 font-bold text-lg" style={{ color: rgbToHex(currentStyle.colors.primary) }}>
                                <span>TOTAL</span>
                                <span>${quote.total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER TEXT */}
                    <div className="mt-16 text-black">
                        <div className="space-y-4">
                            {quote.alcance && (
                                <div>
                                    <h4 className="font-bold text-xs uppercase" style={{ color: rgbToHex(currentStyle.colors.primary) }}>ALCANCE DEL TRABAJO:</h4>
                                    <p className="text-xs whitespace-pre-wrap mt-1">{quote.alcance}</p>
                                </div>
                            )}
                            {quote.formaPago && (
                                <div>
                                    <h4 className="font-bold text-xs uppercase" style={{ color: rgbToHex(currentStyle.colors.primary) }}>FORMA DE PAGO:</h4>
                                    <p className="text-xs mt-1">{quote.formaPago}</p>
                                </div>
                            )}
                            {quote.notaFinal && (
                                <div className="pt-4 border-t border-dashed border-gray-300">
                                    <p className="text-[10px] italic text-gray-500">{quote.notaFinal}</p>
                                </div>
                            )}
                        </div>

                        {/* SIGNATURE SECTION (Removed per user request) */}

                        <div className="mt-12 text-center text-[9px] text-gray-400">
                            Gracias por su confianza. Generado el {format(new Date(), "dd/MM/yyyy HH:mm")}
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
