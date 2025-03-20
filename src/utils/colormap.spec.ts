import { parseColorMapFromStr, COLOR_MAP_CONST } from "./colormaps"

describe("getColormapFromStr", () => {
  it("translates values", () => {
    expect(parseColorMapFromStr("jet")).toEqual(COLOR_MAP_CONST.JET)
  })
  it("translates keys", () => {
    expect(parseColorMapFromStr("JET")).toEqual(COLOR_MAP_CONST.JET)
  })
  it("translates enums", () => {
    expect(parseColorMapFromStr(COLOR_MAP_CONST.JET)).toEqual(COLOR_MAP_CONST.JET)
  })
  it("defaults to greyscale", () => {
    expect(parseColorMapFromStr("foo-bar")).toEqual(COLOR_MAP_CONST.GREYSCALE)
  })
})
