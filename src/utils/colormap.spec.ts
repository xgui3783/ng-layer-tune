import { getColormapFromStr, EnumColorMapName } from "./colormaps"

describe("getColormapFromStr", () => {
  it("translates values", () => {
    expect(getColormapFromStr("jet")).toEqual(EnumColorMapName.JET)
  })
  it("translates keys", () => {
    expect(getColormapFromStr("JET")).toEqual(EnumColorMapName.JET)
  })
  it("translates enums", () => {
    expect(getColormapFromStr(EnumColorMapName.JET)).toEqual(EnumColorMapName.JET)
  })
  it("defaults to greyscale", () => {
    expect(getColormapFromStr("foo-bar")).toEqual(EnumColorMapName.GREYSCALE)
  })
})
