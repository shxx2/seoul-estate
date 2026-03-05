import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getDistrictList, getDongByCode } from '@/lib/region-codes';
import seoulDistricts from '../../../../public/data/seoul-districts.json';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get('type');

  if (type === 'gu') {
    const districts = getDistrictList();
    return apiSuccess(districts);
  }

  if (type === 'dong') {
    const guCode = searchParams.get('guCode');
    if (!guCode) {
      return apiError('INVALID_PARAMS', 'guCode is required when type=dong', 400);
    }

    // Find the district and return its dongs
    const district = seoulDistricts.districts.find(d => d.cortarNo === guCode);
    if (!district) {
      return apiError('NOT_FOUND', `District with guCode=${guCode} not found`, 404);
    }

    const dongs = district.dongs.map(d => getDongByCode(d.cortarNo)).filter(Boolean);
    return apiSuccess(dongs);
  }

  return apiError(
    'INVALID_PARAMS',
    "type query parameter is required and must be 'gu' or 'dong'",
    400
  );
}
